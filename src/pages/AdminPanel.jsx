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
  const [notification, setNotification] = useState(null);
  const [fbAppId, setFbAppId] = useState("");
  const [fbAppSecret, setFbAppSecret] = useState("");
  const [fbModalOpen, setFbModalOpen] = useState(false);
  const [fbSuccessModalOpen, setFbSuccessModalOpen] = useState(false);
  const [fbAccessToken, setFbAccessToken] = useState("");
  const [fbPageId, setFbPageId] = useState("");
  const [fbConnectedPageName, setFbConnectedPageName] = useState("");

  // New state for user management
  const [userInfo, setUserInfo] = useState(null);
  const [showUserManagement, setShowUserManagement] = useState(false);
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // New state for password management
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [showOwnPasswordModal, setShowOwnPasswordModal] = useState(false);
  const [ownPasswordForm, setOwnPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const navigate = useNavigate();
  // Auto-hide notifications after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);
  useEffect(() => {
    const token = localStorage.getItem("token");
    const expiry = localStorage.getItem("token_expiry");

    if (!token || !expiry || Date.now() > parseInt(expiry)) {
      localStorage.removeItem("token");
      localStorage.removeItem("token_expiry");
      navigate("/login");
      return;
    }

    // Load user info first
    loadUserInfo();

    // Load settings
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

  const loadUserInfo = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/admin/user-info`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setUserInfo(data);
      }
    } catch (err) {
      console.error("Failed to load user info", err);
    }
  };

  const loadUsers = async () => {
    if (!userInfo?.is_super_user) return;

    setLoadingUsers(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/admin/users`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      }
    } catch (err) {
      console.error("Failed to load users", err);
      setNotification({ type: "error", message: "Failed to load users" });
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleUserAction = async (userId, action) => {
    try {
      let url = `${
        import.meta.env.VITE_API_BASE_URL
      }/api/admin/users/${userId}`;
      let method = "POST";

      switch (action) {
        case "approve":
          url += "/approve";
          break;
        case "reject":
          url += "/reject";
          break;
        case "toggle":
          url += "/toggle-status";
          break;
        case "delete":
          method = "DELETE";
          break;
      }

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setNotification({ type: "success", message: data.message });
        loadUsers(); // Refresh the list
      } else {
        const error = await response.json();
        setNotification({
          type: "error",
          message: error.detail || "Action failed",
        });
      }
    } catch (err) {
      console.error("User action failed", err);
      setNotification({ type: "error", message: "Action failed" });
    }
  };

  // New password management functions
  const handleChangeUserPassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      setNotification({
        type: "error",
        message: "Password must be at least 8 characters long",
      });
      return;
    }

    setChangingPassword(true);
    try {
      const formData = new FormData();
      formData.append("new_password", newPassword);

      const response = await fetch(
        `${
          import.meta.env.VITE_API_BASE_URL
        }/api/admin/users/${selectedUserId}/change-password`,
        {
          method: "POST",
          body: formData,
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setNotification({ type: "success", message: data.message });
        setPasswordModalOpen(false);
        setNewPassword("");
        setSelectedUserId(null);
      } else {
        const error = await response.json();
        setNotification({
          type: "error",
          message: error.detail || "Failed to change password",
        });
      }
    } catch (err) {
      console.error("Password change failed", err);
      setNotification({ type: "error", message: "Failed to change password" });
    }
  };

  const handleChangeOwnPassword = async () => {
    if (ownPasswordForm.newPassword !== ownPasswordForm.confirmPassword) {
      setNotification({ type: "error", message: "New passwords do not match" });
      return;
    }

    if (ownPasswordForm.newPassword.length < 8) {
      setNotification({
        type: "error",
        message: "Password must be at least 8 characters long",
      });
      return;
    }

    try {
      const formData = new FormData();
      formData.append("current_password", ownPasswordForm.currentPassword);
      formData.append("new_password", ownPasswordForm.newPassword);

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/admin/change-own-password`,
        {
          method: "POST",
          body: formData,
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setNotification({ type: "success", message: data.message });
        setShowOwnPasswordModal(false);
        setOwnPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        const error = await response.json();
        setNotification({
          type: "error",
          message: error.detail || "Failed to change password",
        });
      }
    } catch (err) {
      console.error("Password change failed", err);
      setNotification({ type: "error", message: "Failed to change password" });
    }
  };

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
      setNotification({ type: "error", message: "Upload failed. Try again." });
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
      setNotification({
        type: "success",
        message: "Settings saved successfully!",
      });
    } catch (err) {
      console.error("Save failed", err);
      setNotification({ type: "error", message: "Failed to save settings." });
    }
  };

  const handleFbConnect = async () => {
    setFbConnecting(true);
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
      setNotification({
        type: "error",
        message: `Failed to connect: ${err.message}`,
      });
    } finally {
      setFbConnecting(false);
    }
  };

  return (
    <div className="flex justify-center px-4 py-12 bg-gray-100 min-h-screen">
      <div className="w-full max-w-6xl">
        {/* Header with user info and buttons */}
        <div className="bg-white p-4 rounded-xl shadow-xl mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-semibold text-gray-800">
                Admin Panel
              </h1>
              {userInfo && (
                <p className="text-sm text-gray-600">
                  Logged in as:{" "}
                  <span className="font-medium">{userInfo.email}</span>
                  {userInfo.is_super_user && (
                    <span className="ml-2 bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
                      Super User
                    </span>
                  )}
                </p>
              )}
            </div>
            <div className="flex gap-3">
              {userInfo?.is_super_user && (
                <button
                  onClick={() => {
                    setShowUserManagement(!showUserManagement);
                    if (!showUserManagement) loadUsers();
                  }}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md font-medium"
                >
                  👥 Manage Users
                </button>
              )}
              <button
                onClick={() => {
                  localStorage.removeItem("token");
                  localStorage.removeItem("token_expiry");
                  navigate("/login");
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium"
              >
                🚪 Logout
              </button>
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Main Settings Form */}
          <form
            className="bg-white p-6 sm:p-8 rounded-xl shadow-xl flex-1"
            onSubmit={handleSave}
          >
            <h2 className="text-xl font-semibold text-center text-gray-800 mb-6">
              Application Settings
            </h2>

            {fbConnectedPageName && (
              <p className="text-center text-green-600 font-medium mb-4">
                Connected Page:{" "}
                <span className="font-semibold">{fbConnectedPageName}</span>
              </p>
            )}

            {/* All original form fields */}
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

          {/* User Management Panel */}
          {showUserManagement && userInfo?.is_super_user && (
            <div className="bg-white p-6 rounded-xl shadow-xl w-96">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                User Management
              </h3>

              {loadingUsers ? (
                <p className="text-center py-4">Loading users...</p>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {users.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      No users found
                    </p>
                  ) : (
                    users.map((user) => (
                      <div
                        key={user.id}
                        className="border rounded-lg p-4 space-y-2"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-sm">{user.email}</p>
                            <div className="flex gap-2 mt-1">
                              {user.is_super_user && (
                                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs">
                                  Super User
                                </span>
                              )}
                              <span
                                className={`px-2 py-1 rounded-full text-xs ${
                                  user.is_approved
                                    ? "bg-green-100 text-green-800"
                                    : "bg-yellow-100 text-yellow-800"
                                }`}
                              >
                                {user.is_approved ? "Approved" : "Pending"}
                              </span>
                              <span
                                className={`px-2 py-1 rounded-full text-xs ${
                                  user.is_active
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-red-100 text-red-800"
                                }`}
                              >
                                {user.is_active ? "Active" : "Inactive"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2 flex-wrap">
                          {/* Password change button for all users (super user only) */}
                          {userInfo?.is_super_user && (
                            <button
                              onClick={() => {
                                setSelectedUserId(user.id);
                                setPasswordModalOpen(true);
                              }}
                              className="bg-yellow-500 hover:bg-yellow-600 text-white text-xs px-3 py-1 rounded"
                            >
                              🔑 Change Password
                            </button>
                          )}

                          {!user.is_super_user && (
                            <>
                              {!user.is_approved && (
                                <>
                                  <button
                                    onClick={() =>
                                      handleUserAction(user.id, "approve")
                                    }
                                    className="bg-green-500 hover:bg-green-600 text-white text-xs px-3 py-1 rounded"
                                  >
                                    ✅ Approve
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleUserAction(user.id, "reject")
                                    }
                                    className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1 rounded"
                                  >
                                    ❌ Reject
                                  </button>
                                </>
                              )}

                              {user.is_approved && (
                                <button
                                  onClick={() =>
                                    handleUserAction(user.id, "toggle")
                                  }
                                  className={`text-white text-xs px-3 py-1 rounded ${
                                    user.is_active
                                      ? "bg-orange-500 hover:bg-orange-600"
                                      : "bg-blue-500 hover:bg-blue-600"
                                  }`}
                                >
                                  {user.is_active
                                    ? "🔒 Deactivate"
                                    : "🔓 Activate"}
                                </button>
                              )}

                              <button
                                onClick={() =>
                                  handleUserAction(user.id, "delete")
                                }
                                className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1 rounded"
                              >
                                🗑️ Delete
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              <button
                onClick={loadUsers}
                className="mt-4 w-full bg-gray-500 hover:bg-gray-600 text-white py-2 rounded"
              >
                🔄 Refresh
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Change User Password Modal (Super User Only) */}
      {passwordModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-md shadow-lg w-96">
            <h3 className="text-xl font-semibold mb-4">Change User Password</h3>

            <label className="block mb-2 text-sm font-medium">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password (min 8 characters)"
              className="w-full border px-3 py-2 rounded mb-4"
              minLength={8}
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setPasswordModalOpen(false);
                  setNewPassword("");
                  setSelectedUserId(null);
                }}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleChangeUserPassword}
                disabled={changingPassword || newPassword.length < 8}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
              >
                {changingPassword ? "Changing..." : "Change Password"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Own Password Modal */}
      {showOwnPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-md shadow-lg w-96">
            <h3 className="text-xl font-semibold mb-4">Change Your Password</h3>

            <label className="block mb-2 text-sm font-medium">
              Current Password
            </label>
            <input
              type="password"
              value={ownPasswordForm.currentPassword}
              onChange={(e) =>
                setOwnPasswordForm({
                  ...ownPasswordForm,
                  currentPassword: e.target.value,
                })
              }
              placeholder="Enter current password"
              className="w-full border px-3 py-2 rounded mb-4"
            />

            <label className="block mb-2 text-sm font-medium">
              New Password
            </label>
            <input
              type="password"
              value={ownPasswordForm.newPassword}
              onChange={(e) =>
                setOwnPasswordForm({
                  ...ownPasswordForm,
                  newPassword: e.target.value,
                })
              }
              placeholder="Enter new password (min 8 characters)"
              className="w-full border px-3 py-2 rounded mb-4"
              minLength={8}
            />

            <label className="block mb-2 text-sm font-medium">
              Confirm New Password
            </label>
            <input
              type="password"
              value={ownPasswordForm.confirmPassword}
              onChange={(e) =>
                setOwnPasswordForm({
                  ...ownPasswordForm,
                  confirmPassword: e.target.value,
                })
              }
              placeholder="Confirm new password"
              className="w-full border px-3 py-2 rounded mb-4"
            />

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowOwnPasswordModal(false);
                  setOwnPasswordForm({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                  });
                }}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleChangeOwnPassword}
                disabled={
                  !ownPasswordForm.currentPassword ||
                  !ownPasswordForm.newPassword ||
                  !ownPasswordForm.confirmPassword ||
                  ownPasswordForm.newPassword !==
                    ownPasswordForm.confirmPassword
                }
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded disabled:opacity-50"
              >
                Change Password
              </button>
            </div>
          </div>
        </div>
      )}

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
      {/* Notification Toast */}
      {notification && (
        <div className="fixed top-4 right-4 z-50">
          <div
            className={`px-4 py-3 rounded-md shadow-lg ${
              notification.type === "success"
                ? "bg-green-500 text-white"
                : "bg-red-500 text-white"
            }`}
          >
            <div className="flex items-center justify-between">
              <span>{notification.message}</span>
              <button
                onClick={() => setNotification(null)}
                className="ml-4 text-white hover:text-gray-200"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
