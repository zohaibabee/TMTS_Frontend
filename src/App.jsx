import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CapturePage from './pages/CapturePage';
import AdminPanel from './pages/AdminPanel';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import SlideshowPage from './pages/SlideshowPage';
// AdminPanel, SlideshowPage, LoginPage will be added later

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<CapturePage />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/slideshow" element={<SlideshowPage />} />
      </Routes>
    </Router>
  );
}

export default App;
