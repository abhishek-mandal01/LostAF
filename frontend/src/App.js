import { useEffect, useState } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";
import LandingPage from "@/pages/LandingPage";
import Dashboard from "@/pages/Dashboard";
import PostItem from "@/pages/PostItem";
import ItemDetails from "@/pages/ItemDetails";
import MyItems from "@/pages/MyItems";
import AdminDashboard from "@/pages/AdminDashboard";
import { Toaster } from "@/components/ui/sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window?.REACT_APP_BACKEND_URL || null;
// At runtime, if env var wasn't embedded at build time, fall back to window.location.origin
const resolvedBackend = BACKEND_URL || (typeof window !== 'undefined' ? window.location.origin : '');
const API = `${resolvedBackend}/api`;

export const api = axios.create({
  baseURL: API,
  withCredentials: true
});

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for session_id in URL
    const hash = window.location.hash;
    if (hash && hash.includes("session_id=")) {
      const sessionId = hash.split("session_id=")[1].split("&")[0];
      handleSession(sessionId);
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else {
      checkAuth();
    }
  }, []);

  const handleSession = async (sessionId) => {
    try {
      const response = await api.post("/auth/session", { session_id: sessionId });
      setUser(response.data.user);
      setLoading(false);
      window.location.href = "/dashboard";
    } catch (error) {
      console.error("Session creation failed:", error);
      setLoading(false);
    }
  };

  const checkAuth = async () => {
    try {
      const response = await api.get("/auth/me");
      setUser(response.data);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div className="App">
      <Toaster position="top-right" />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={user ? <Navigate to="/dashboard" /> : <LandingPage />} />
          <Route path="/dashboard" element={user ? <Dashboard user={user} setUser={setUser} /> : <Navigate to="/" />} />
          <Route path="/post" element={user ? <PostItem user={user} setUser={setUser} /> : <Navigate to="/" />} />
          <Route path="/item/:id" element={user ? <ItemDetails user={user} setUser={setUser} /> : <Navigate to="/" />} />
          <Route path="/my-items" element={user ? <MyItems user={user} setUser={setUser} /> : <Navigate to="/" />} />
          <Route path="/admin" element={user ? <AdminDashboard user={user} setUser={setUser} /> : <Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
