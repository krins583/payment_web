import { useState } from "react";
import Navigation from "./Navigation";
import CreatePayment from "./CreatePayment";
import PaymentHistory from "./PaymentHistory";
import "./Dashboard.css";
// AI Generated Asset Import (Same as login)
import dashboardBg from "./login-bg.png"; 

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("create");

  // LOGOUT FUNCTIONALITY
  const handleLogout = () => {
    localStorage.removeItem("isAdminAuthenticated");
    window.location.href = "/";
  };

  return (
    <div className="dashboard-wrapper">
      {/* Background Layer with AI Image */}
      <div className="dash-bg-layer" style={{ backgroundImage: `url(${dashboardBg})` }}>
        <div className="dash-overlay"></div>
      </div>

      <main className="paydash-page">
        <div className="paydash-shell">
          <header className="paydash-header glass-panel">
            <div className="paydash-brand">
              <div className="paydash-logo hologram-effect">D</div>
              <div>
                <span>Secure Console</span>
                <h1>DASH Operations</h1>
              </div>
            </div>

            <div className="header-actions">
              <div className="paydash-status cyber-chip">
                <span className="status-dot cyber-pulse" />
                Network Secured
              </div>
              
              <button onClick={handleLogout} className="logout-btn cyber-btn-outline">
                Disconnect
              </button>
            </div>
          </header>

          <section className="paydash-hero glass-panel">
            <div className="hero-copy-block">
              <p className="paydash-kicker">Payment Workspace</p>
              <h2>Create links, deploy rules, collect securely.</h2>
              <p className="hero-description">
                Advanced dashboard for dynamic payment protocols, temporal penalties, 
                and encrypted proof verifications.
              </p>
            </div>

            <div className="hero-ledger">
              <div className="glass-chip">
                <span>Protocol</span>
                <strong>UPI</strong>
              </div>
              <div className="glass-chip">
                <span>Penalty</span>
                <strong>Active</strong>
              </div>
              <div className="glass-chip">
                <span>Verification</span>
                <strong>Strict</strong>
              </div>
            </div>
          </section>

          {/* Navigation aur Content bhi ab inhi CSS variables ke karan dark/cyber mode lenge */}
          <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

          <section className="paydash-content glass-panel-content">
            {activeTab === "create" && <CreatePayment />}
            {activeTab === "history" && <PaymentHistory />}
          </section>
        </div>
      </main>
    </div>
  );
}