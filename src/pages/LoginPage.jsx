import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Both fields are required");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/auth/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            username: email,
            password: password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        // Handle different error types with better messaging
        if (response.status === 403) {
          if (data.detail.includes("pending approval")) {
            setError(
              "Your account is pending approval. Please contact the administrator."
            );
          } else if (data.detail.includes("deactivated")) {
            setError(
              "Your account has been deactivated. Please contact the administrator."
            );
          } else {
            setError(data.detail || "Access denied");
          }
        } else if (response.status === 401) {
          setError("Invalid email or password. Please try again.");
        } else {
          setError(data.detail || "Login failed");
        }
        return;
      }

      const expirationTime = Date.now() + 2.5 * 60 * 60 * 1000; // 2.5 hours
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("token_expiry", expirationTime);

      navigate("/admin");
    } catch (err) {
      console.error("Login error", err);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 px-4">
      <div className="bg-white p-6 sm:p-8 rounded-xl shadow-xl w-full max-w-sm">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Admin Login</h2>
          <p className="text-gray-600 text-sm mt-2">
            Sign in to access the admin panel
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-md font-semibold text-sm transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Signing in..." : "🔑 Sign In"}
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <button
              onClick={() => navigate("/signup")}
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              Request Access
            </button>
          </p>

          <p className="text-sm text-gray-600 mt-2">
            System administrator?{" "}
            <button
              onClick={() => navigate("/setup-superuser")}
              className="text-purple-600 hover:text-purple-800 font-medium"
            >
              Setup Super User
            </button>
          </p>
        </div>

        {/* Status indicators */}
        <div className="mt-6 p-3 bg-gray-50 rounded-md">
          <p className="text-xs text-gray-600 text-center">
            <strong>Account Status Guide:</strong>
          </p>
          <div className="text-xs text-gray-500 mt-2 space-y-1">
            <p>
              • <span className="text-yellow-600">Pending Approval:</span>{" "}
              Contact administrator
            </p>
            <p>
              • <span className="text-red-600">Deactivated:</span> Account
              suspended
            </p>
            <p>
              • <span className="text-green-600">Active:</span> Ready to login
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
