import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function SuperUserSetup() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    secretKey: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !form.email ||
      !form.password ||
      !form.confirmPassword ||
      !form.secretKey
    ) {
      setError("All fields are required");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("email", form.email);
    formData.append("password", form.password);
    formData.append("secret_key", form.secretKey);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/admin/create-superuser`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setForm({
          email: "",
          password: "",
          confirmPassword: "",
          secretKey: "",
        });
      } else {
        if (response.status === 403) {
          setError(
            "Invalid secret key. Please contact your system administrator."
          );
        } else if (
          response.status === 400 &&
          data.detail.includes("already exists")
        ) {
          setError(
            "Super user already exists. Please use the login page instead."
          );
        } else {
          setError(data.detail || "Failed to create super user");
        }
      }
    } catch (err) {
      console.error("Super user creation failed", err);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  // Success screen
  if (success) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
        <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md text-center">
          <div className="mb-6">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-green-600 mb-2">
              Super User Created!
            </h2>
            <p className="text-gray-600">
              The super administrator account has been created successfully. You
              can now login and manage the system.
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
            <p className="text-sm text-green-800">
              <strong>What you can do now:</strong>
            </p>
            <ul className="text-xs text-green-700 mt-2 space-y-1 text-left">
              <li>• Login with your super user credentials</li>
              <li>• Access the admin panel and all settings</li>
              <li>• Review and approve user access requests</li>
              <li>• Manage other administrator accounts</li>
              <li>• Configure application settings</li>
            </ul>
          </div>

          <button
            onClick={() => navigate("/login")}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-md transition duration-200"
          >
            🔑 Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Setup form
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-purple-600">
            🔐 Super User Setup
          </h2>
          <p className="text-gray-600 mt-2">
            Create the super administrator account for this application
          </p>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-md p-4 mb-6">
          <p className="text-sm text-purple-800">
            <strong>⚠️ Important:</strong> This is a one-time setup process. The
            super user will have full administrative privileges and can manage
            all other accounts.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              minLength={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="Enter a strong password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="Confirm your password"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Secret Key
            </label>
            <input
              type="password"
              name="secretKey"
              value={form.secretKey}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="Enter the super user secret key"
            />
            <p className="text-xs text-gray-500 mt-1">
              This secret key should be provided by your system administrator or
              found in your environment configuration.
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <p className="text-sm text-yellow-800">
              <strong>Security Note:</strong> The secret key is set in your
              server's environment variables. Contact your technical team if you
              don't have this key.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-md transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Creating Super User..." : "🔐 Create Super User"}
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <button
              onClick={() => navigate("/login")}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Login here
            </button>
          </p>

          <p className="text-sm text-gray-600 mt-2">
            Need regular access?{" "}
            <button
              onClick={() => navigate("/signup")}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Request Access
            </button>
          </p>
        </div>

        {/* Security information */}
        <div className="mt-6 p-3 bg-gray-50 rounded-md">
          <p className="text-xs text-gray-600 font-medium mb-2">
            Security Guidelines:
          </p>
          <ul className="text-xs text-gray-500 space-y-1">
            <li>• Use a strong, unique password (minimum 8 characters)</li>
            <li>• Keep your credentials secure and confidential</li>
            <li>• Never share your super user access with others</li>
            <li>• This setup can only be done once</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
