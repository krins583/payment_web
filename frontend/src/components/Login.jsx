import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase"; // Aapki firebase file
import { signInWithEmailAndPassword } from "firebase/auth";
import "./Login.css";

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
      // Seedha Firebase se authentication
      await signInWithEmailAndPassword(auth, email, password);
      
      localStorage.setItem("isAdminAuthenticated", "true");
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      if (err.code === "auth/user-not-found" || err.code === "auth/wrong-password" || err.code === "auth/invalid-credential") {
        setError("Invalid email or password. Access denied.");
      } else {
        setError("Authentication failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <section className="login-card">
        <header className="login-header">
          <div className="logo-icon">₹</div>
          <span>Console Authentication</span>
          <h1>Admin Sign In</h1>
        </header>

        <form onSubmit={handleLogin} className="login-form">
          {error && <div className="login-error-msg">{error}</div>}

          <div className="login-group">
            <label>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter admin email"
              required
            />
          </div>

          <div className="login-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" disabled={loading} className="login-submit">
            {loading ? "Verifying..." : "Secure Sign In"}
          </button>
        </form>
      </section>
    </div>
  );
}