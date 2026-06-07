import "./Navigation.css";

export default function Navigation({ activeTab, setActiveTab }) {
  return (
    <nav className="paynav" role="tablist" aria-label="Dashboard sections">
      <button
        className={`paynav-btn ${activeTab === "create" ? "active" : ""}`}
        onClick={() => setActiveTab("create")}
        type="button"
        role="tab"
        aria-selected={activeTab === "create"}
      >
        <span>01</span>
        Create Link
      </button>

      <button
        className={`paynav-btn ${activeTab === "history" ? "active" : ""}`}
        onClick={() => setActiveTab("history")}
        type="button"
        role="tab"
        aria-selected={activeTab === "history"}
      >
        <span>02</span>
        Ledger History
      </button>
    </nav>
  );
}