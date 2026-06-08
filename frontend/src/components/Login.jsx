import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase"; // Aapki firebase.js file ka path
import { signInWithEmailAndPassword } from "firebase/auth";
import "./Login.css";
// AI Generated Asset Import
import roboticGuardImg from "./login-bg.png"; 

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Direct Firebase Auth (No backend API required, fixes Network Error)
      await signInWithEmailAndPassword(auth, email, password);
      
      localStorage.setItem("isAdminAuthenticated", "true");
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      // Firebase specific error handling
      if (
        err.code === "auth/user-not-found" || 
        err.code === "auth/wrong-password" || 
        err.code === "auth/invalid-credential"
      ) {
        setError("Invalid email or password. Access denied.");
      } else if (err.code === "auth/invalid-api-key") {
        setError("Firebase API Key is invalid. Check your .env file.");
      } else {
        setError("Authentication failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      {/* Background Layer with AI Image */}
      <div className="login-bg-layer" style={{ backgroundImage: `url(${roboticGuardImg})` }}>
        <div className="login-overlay"></div>
      </div>

      {/* Foreground Content - Perfectly Centered Layout */}
      <div className="login-content-shell">
        <div className="login-form-panel">
          <section className="login-glass-card">
            <header className="login-header">
              <div className="hologram-logo">D</div>
              <span>Console Access</span>
              <h1>DASH Admin</h1>
              <p>Enter your console credentials to access the secure area.</p>
            </header>

            <form onSubmit={handleLogin} className="login-form">
              {error && (
                <div className="login-error-msg">
                  <svg fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <div className="login-group">
                <label>System Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@system.dash"
                  required
                />
              </div>

              <div className="login-group">
                <label>Security Key</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                />
              </div>

              <button type="submit" disabled={loading} className="login-submit">
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Authenticating...
                  </>
                ) : (
                  "⚡ Initiate Secure Sign In"
                )}
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}