import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminPanel() {
  const [form, setForm] = useState({
    businessName: "",
    businessAddress: "",
    hashtags: "",
    captions: ["", "", "", "", ""],
    photoLimit: 15,
    interval: 5,
    pageTitle: "",
    logo: "",
    background: "",
  });

  const [fbConnecting, setFbConnecting] = useState(false);
  const [fbAppId, setFbAppId] = useState("");
  const [fbAppSecret, setFbAppSecret] = useState("");
  const [fbModalOpen, setFbModalOpen] = useState(false);
  const [fbSuccessModalOpen, setFbSuccessModalOpen] = useState(false);
  const [fbAccessToken, setFbAccessToken] = useState("");
  const [fbPageId, setFbPageId] = useState("");
  const [fbConnectedPageName, setFbConnectedPageName] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const expiry = localStorage.getItem("token_expiry");

    if (!token || !expiry || Date.now() > parseInt(expiry)) {
      localStorage.removeItem("token");
      localStorage.removeItem("token_expiry");
      navigate("/login");
      return;
    }

    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/admin/settings`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then((data) => {
        setForm({
          businessName: data.business_name,
          businessAddress: data.business_address,
          hashtags: data.hashtags,
          captions: data.caption_templates,
          photoLimit: data.max_photos,
          interval: data.post_interval_minutes,
          pageTitle: data.page_title,
          logo: data.logo_filename
            ? `${import.meta.env.VITE_API_BASE_URL}${data.logo_filename}`
            : "",
          background: data.background_filename
            ? `${import.meta.env.VITE_API_BASE_URL}${data.background_filename}`
            : "",
        });
      })
      .catch((err) => {
        console.error("Failed to load settings", err);
        localStorage.removeItem("token");
        localStorage.removeItem("token_expiry");
        navigate("/login");
      });
  }, [navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCaptionChange = (index, value) => {
    const updatedCaptions = [...form.captions];
    updatedCaptions[index] = value;
    setForm({ ...form, captions: updatedCaptions });
  };

  const addCaptionField = () => {
    if (form.captions.length < 5) {
      setForm({ ...form, captions: [...form.captions, ""] });
    }
  };

  const removeCaptionField = (index) => {
    const updated = [...form.captions];
    updated.splice(index, 1);
    setForm({ ...form, captions: updated });
  };

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const uploadUrl =
      type === "logo"
        ? `${import.meta.env.VITE_API_BASE_URL}/api/admin/upload/logo`
        : `${import.meta.env.VITE_API_BASE_URL}/api/admin/upload/background`;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (!response.ok) throw new Error("Upload failed");

      const data = await response.json();
      setForm({ ...form, [type]: data.url });
    } catch (err) {
      console.error("Upload failed", err);
      alert("Upload failed. Try again.");
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("business_name", form.businessName);
    formData.append("business_address", form.businessAddress);
    formData.append("hashtags", form.hashtags);
    form.captions.forEach((caption) =>
      formData.append("caption_templates", caption)
    );
    formData.append("max_photos", form.photoLimit);
    formData.append("post_interval_minutes", form.interval);
    formData.append("page_title", form.pageTitle);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/admin/settings`,
        {
          method: "POST",
          body: formData,
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!response.ok) throw new Error("Failed to save settings");
      alert("Settings saved successfully!");
    } catch (err) {
      console.error("Save failed", err);
      alert("Failed to save settings.");
    }
  };

  const handleFbConnect = async () => {
    setFbConnecting(true); // start loading
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/admin/page_connection`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            app_id: fbAppId,
            app_secret: fbAppSecret,
            user_token: fbAccessToken,
            page_id: fbPageId,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Unknown error");
      }

      const data = await response.json();
      setFbConnectedPageName(data.page_name);
      setFbSuccessModalOpen(true);
      setFbModalOpen(false);
      setFbAccessToken("");
      setFbPageId("");
    } catch (err) {
      console.error("Facebook connection failed", err);
      alert(`❌ Failed to connect: ${err.message}`);
    } finally {
      setFbConnecting(false); // stop loading
    }
  };

  return (
    <div className="flex justify-center px-4 py-12 bg-gray-100 min-h-screen">
      <form
        className="bg-white p-6 sm:p-8 rounded-xl shadow-xl w-full max-w-xl"
        onSubmit={handleSave}
      >
        <h2 className="text-2xl font-semibold text-center text-gray-800 mb-2">
          Admin Panel
        </h2>

        {fbConnectedPageName && (
          <p className="text-center text-green-600 font-medium mb-4">
            Connected Page:{" "}
            <span className="font-semibold">{fbConnectedPageName}</span>
          </p>
        )}

        {/* All original inputs below */}

        <label className="block font-medium text-sm text-gray-700 mt-4">
          Business Name
        </label>
        <input
          type="text"
          name="businessName"
          value={form.businessName}
          onChange={handleChange}
          className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
        />

        <label className="block font-medium text-sm text-gray-700 mt-4">
          Business Address
        </label>
        <input
          type="text"
          name="businessAddress"
          value={form.businessAddress}
          onChange={handleChange}
          className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
        />

        <label className="block font-medium text-sm text-gray-700 mt-4">
          Hashtags (comma-separated)
        </label>
        <input
          type="text"
          name="hashtags"
          value={form.hashtags}
          onChange={handleChange}
          className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
        />

        <label className="block font-medium text-sm text-gray-700 mt-4">
          Caption Templates
        </label>
        <div className="space-y-3 mt-2">
          {form.captions.map((caption, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="text"
                placeholder={`Caption ${index + 1}`}
                value={caption}
                onChange={(e) => handleCaptionChange(index, e.target.value)}
                className="flex-1 border rounded-md px-3 py-2 text-sm"
              />
              {form.captions.length > 1 && (
                <button
                  type="button"
                  className="text-red-500 hover:text-red-700"
                  onClick={() => removeCaptionField(index)}
                >
                  ❌
                </button>
              )}
            </div>
          ))}
        </div>
        {form.captions.length < 5 && (
          <button
            type="button"
            onClick={addCaptionField}
            className="mt-3 bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2 rounded"
          >
            + Add Caption
          </button>
        )}

        <label className="block font-medium text-sm text-gray-700 mt-6">
          Number of photos to retain (15–99)
        </label>
        <input
          type="number"
          name="photoLimit"
          value={form.photoLimit}
          min="15"
          max="99"
          onChange={handleChange}
          className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
        />

        <label className="block font-medium text-sm text-gray-700 mt-4">
          Posting Interval (minutes)
        </label>
        <input
          type="number"
          name="interval"
          value={form.interval}
          min="1"
          onChange={handleChange}
          className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
        />

        <label className="block font-medium text-sm text-gray-700 mt-4">
          Page Title
        </label>
        <input
          type="text"
          name="pageTitle"
          value={form.pageTitle}
          onChange={handleChange}
          className="mt-1 w-full border rounded-md px-3 py-2 text-sm"
        />

        <div className="mt-4">
          <label
            htmlFor="logo-upload"
            className="cursor-pointer inline-block bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium py-2 px-4 rounded"
          >
            Upload Logo
          </label>
          <input
            id="logo-upload"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFileUpload(e, "logo")}
          />
          {form.logo && (
            <img
              src={form.logo}
              alt="Logo"
              className="h-16 mt-2 object-contain"
            />
          )}
        </div>

        <div className="mt-4">
          <label
            htmlFor="background-upload"
            className="cursor-pointer inline-block bg-purple-500 hover:bg-purple-600 text-white text-sm font-medium py-2 px-4 rounded"
          >
            Upload Background Image
          </label>
          <input
            id="background-upload"
            type="file"
            accept="image/*"
            onChange={(e) => handleFileUpload(e, "background")}
            className="hidden"
          />
          {form.background && (
            <img
              src={form.background}
              alt="Background"
              className="h-16 mt-2 object-cover"
            />
          )}
        </div>

        <button
          type="button"
          className="mt-6 w-full bg-blue-500 hover:bg-blue-600 text-white py-2 font-medium rounded"
          onClick={() => setFbModalOpen(true)}
        >
          📘 Attach Facebook Page
        </button>

        <button
          type="submit"
          className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-3 font-semibold rounded-md"
        >
          💾 Save Settings
        </button>
      </form>

      {/* Facebook Connect Modal */}
      {/* Facebook Connect Modal */}
      {fbModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-md shadow-lg w-96">
            <h3 className="text-xl font-semibold mb-4">
              Connect Facebook Page
            </h3>

            <label className="block mb-2 text-sm font-medium">App ID</label>
            <input
              type="text"
              value={fbAppId}
              onChange={(e) => setFbAppId(e.target.value)}
              className="w-full border px-3 py-2 rounded mb-4"
            />

            <label className="block mb-2 text-sm font-medium">App Secret</label>
            <input
              type="text"
              value={fbAppSecret}
              onChange={(e) => setFbAppSecret(e.target.value)}
              className="w-full border px-3 py-2 rounded mb-4"
            />

            <label className="block mb-2 text-sm font-medium">
              User Access Token
            </label>
            <input
              type="text"
              value={fbAccessToken}
              onChange={(e) => setFbAccessToken(e.target.value)}
              className="w-full border px-3 py-2 rounded mb-4"
            />

            <label className="block mb-2 text-sm font-medium">Page ID</label>
            <input
              type="text"
              value={fbPageId}
              onChange={(e) => setFbPageId(e.target.value)}
              className="w-full border px-3 py-2 rounded mb-4"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setFbModalOpen(false)}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleFbConnect}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center justify-center"
                disabled={fbConnecting}
              >
                {fbConnecting ? "⏳ Connecting..." : "Connect"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {fbSuccessModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-md shadow-lg w-96 text-center">
            <h3 className="text-xl font-semibold mb-4 text-green-700">
              🎉 Connected!
            </h3>
            <p className="mb-6">
              Connected to <strong>{fbConnectedPageName}</strong> successfully!
            </p>
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded"
              onClick={() => setFbSuccessModalOpen(false)}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
