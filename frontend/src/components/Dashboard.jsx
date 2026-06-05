import { useState } from "react";
import Navigation from "./Navigation";
import CreatePayment from "./CreatePayment";
import PaymentHistory from "./PaymentHistory";
import "./Dashboard.css"; 

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("create");

  return (
    <main className="dashboard-page">
      <div className="dashboard-container">
        
        {/* COMPACT HERO SECTION */}
        <section className="dashboard-hero">
          <div className="hero-copy">
            <span className="eyebrow">Payment Link Studio</span>
            <h1>Manage your smart UPI collections.</h1>
            <p>Generate payment links with dynamic penalty rules, share them securely, and track every transaction in real-time.</p>
          </div>
          
          <div className="hero-panel" aria-label="Quick Stats">
            <div className="hero-panel-top">
              <span>System Status</span>
              <strong>Online</strong>
            </div>
            <div className="hero-panel-grid" style={{gridTemplateColumns: "1fr 1fr"}}>
              <div><span>Speed</span><strong>Lightning</strong></div>
              <div><span>Security</span><strong>256-bit</strong></div>
            </div>
          </div>
        </section>

        {/* MODULAR NAVIGATION TAB COMPONENT */}
        <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* CONTENT RENDERING (Yeh aapki nayi files ko yahan layega) */}
        {activeTab === "create" && <CreatePayment />}
        {activeTab === "history" && <PaymentHistory />}
        
      </div>
    </main>
  );
}