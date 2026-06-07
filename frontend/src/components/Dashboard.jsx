import { useState } from "react";
import Navigation from "./Navigation";
import CreatePayment from "./CreatePayment";
import PaymentHistory from "./PaymentHistory";
import "./Dashboard.css";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("create");

  const handleLogout = () => {
  localStorage.removeItem("isAdminAuthenticated"); // Token remove ho jayega
  window.location.href = "/"; // Auto lock ho jayega screen
};

  return (
    <main className="paydash-page">
      <div className="paydash-shell">
        <header className="paydash-header">
          <div className="paydash-brand">
            <div className="paydash-logo">₹</div>
            <div>
              <span>Dynamic UPI Console</span>
              <h1>Payment operations, without the clutter.</h1>
            </div>
          </div>

          <div className="paydash-status">
            <span className="status-dot" />
            Server connected
          </div>
        </header>

        <section className="paydash-hero">
          <div className="hero-copy-block">
            <p className="paydash-kicker">Payment workspace</p>
            <h2>Create links, apply rules, collect faster.</h2>
            <p className="hero-description">
              A focused dashboard for dynamic payment links, penalty timers,
              customer proof uploads, and receipt-ready history.
            </p>
          </div>

          <div className="hero-ledger">
            <div>
              <span>Mode</span>
              <strong>UPI</strong>
            </div>
            <div>
              <span>Penalty</span>
              <strong>Timed</strong>
            </div>
            <div>
              <span>Proof</span>
              <strong>Upload</strong>
            </div>
          </div>
        </section>

        <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

        <section className="paydash-content">
          {activeTab === "create" && <CreatePayment />}
          {activeTab === "history" && <PaymentHistory />}
        </section>
      </div>
    </main>
  );
}