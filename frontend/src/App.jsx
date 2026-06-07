import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./components/Dashboard";
import Payment from "./components/Payment";
import Login from "./components/Login";

// Protected Route Guard
function ProtectedAdminRoute({ children }) {
  const isAuthenticated = localStorage.getItem("isAdminAuthenticated") === "true";
  
  // Agar logged in nahi hai, toh link ke siwa kuch nahi khulega, seedha login par bhej dega
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Router>
      <Routes>
        {/* 1. FRONT PAGE: Website khulne par sabse pehle Login open hoga */}
        <Route path="/" element={<Login />} />

        {/* 2. PROTECTED DASHBOARD: Bina login ke yeh access nahi ho sakta */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedAdminRoute>
              <Dashboard />
            </ProtectedAdminRoute>
          } 
        />

        {/* 3. PUBLIC PAYMENT LINK: Yeh hamesha sabke liye khula rahega */}
        <Route path="/pay/:linkId" element={<Payment />} />

        {/* Galat URL daalne par fallback redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}