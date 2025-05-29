import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import CapturePage from "./pages/CapturePage";
import AdminPanel from "./pages/AdminPanel";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import SlideshowPage from "./pages/SlideshowPage";

// Auth check wrapper
function RequireAuth({ children }) {
  const token = localStorage.getItem("token");
  const expiry = localStorage.getItem("token_expiry");

  if (!token || !expiry || Date.now() > parseInt(expiry)) {
    localStorage.removeItem("token");
    localStorage.removeItem("token_expiry");
    return <Navigate to="/login" replace />;
  }

  return children;
}

function App() {
  return (
    <Router basename="/tmt">
      {" "}
      {/* 👈 IMPORTANT FIX HERE */}
      <Routes>
        <Route path="/" element={<CapturePage />} />
        <Route path="/slideshow" element={<SlideshowPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route
          path="/admin"
          element={
            <RequireAuth>
              <AdminPanel />
            </RequireAuth>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
