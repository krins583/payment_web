import "./Navigation.css";

export default function Navigation({ activeTab, setActiveTab }) {
  return (
    <div className="dash-nav" role="tablist" aria-label="Dashboard sections">
      <button
        className={`nav-btn ${activeTab === "create" ? "active" : ""}`}
        onClick={() => setActiveTab("create")}
        type="button"
        role="tab"
        aria-selected={activeTab === "create"}
      >
        Create Payment
      </button>
      <button
        className={`nav-btn ${activeTab === "history" ? "active" : ""}`}
        onClick={() => setActiveTab("history")}
        type="button"
        role="tab"
        aria-selected={activeTab === "history"}
      >
        Payment History
      </button>
    </div>
  );
}