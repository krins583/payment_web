import { useState } from "react";
import axios from "axios";
import "./CreatePayment.css";

export default function CreatePayment() {
  const [formData, setFormData] = useState({
    upiId: "", basePrice: "", payerName: "", payerNumber: "", penaltyAmount: 10, penaltyTime: 10,
  });

  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const formatAmount = (value) => {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value) || 0);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setCopied(false);
    try {
      const response = await axios.post("http://localhost:5000/api/create-link", formData);
      if (response.data.success) {
        setLink(`${window.location.origin}/pay/${response.data.linkId}`);
      }
    } catch (error) {
      alert("Error generating link.");
    } finally {
      setLoading(false);
    }
  };

  const copyLink = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <section className="admin-dashboard">
      <div className="form-panel">
        <div className="dashboard-header">
          <span style={{color: "#1769e8", fontWeight: "bold", fontSize:"12px"}}>NEW COLLECTION</span>
          <h2>Create Payment Link</h2>
          <p>Add details to generate a dynamic UPI payment URL.</p>
        </div>

        <form onSubmit={handleCreate} className="form-grid">
          <div className="form-group"><label>Receiver UPI ID</label><input name="upiId" onChange={handleChange} required /></div>
          <div className="form-group"><label>Base Price (₹)</label><input name="basePrice" type="number" onChange={handleChange} required /></div>
          <div className="form-group"><label>Payer Name</label><input name="payerName" onChange={handleChange} /></div>
          <div className="form-group"><label>Payer WhatsApp</label><input name="payerNumber" onChange={handleChange} /></div>

          <div className="penalty-section">
            <div className="penalty-title">
              <span className="penalty-icon">₹</span>
              <div>
                <strong>Dynamic Pricing Rules</strong>
                <small>Amount increases after the selected interval.</small>
              </div>
            </div>
            <div className="form-group"><label>Penalty Amount</label><input name="penaltyAmount" type="number" value={formData.penaltyAmount} onChange={handleChange} /></div>
            <div className="form-group"><label>Interval (Mins)</label><input name="penaltyTime" type="number" value={formData.penaltyTime} onChange={handleChange} /></div>
          </div>

          <button type="submit" className="generate-btn" disabled={loading}>
            {loading ? "Generating..." : "Generate Payment Link"}
          </button>
        </form>

        {link && (
          <div className="result-box">
            <div><span style={{color:"#0f8f72", fontWeight:"bold", fontSize:"12px"}}>LINK READY</span><br/><a href={link} target="_blank" rel="noreferrer">{link}</a></div>
            <div className="result-actions">
              <button onClick={copyLink}>{copied ? "Copied" : "Copy"}</button>
              <a href={link} target="_blank" rel="noreferrer">Open</a>
            </div>
          </div>
        )}
      </div>

      <aside className="preview-panel">
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
          <span style={{color:"#8be7cf", fontWeight:"bold"}}>PREVIEW</span>
          <span className="preview-status">Ready</span>
        </div>
        <div className="preview-amount">{formatAmount(formData.basePrice)}</div>
        <div className="preview-details">
          <div><span>RECEIVER</span><strong>{formData.upiId || "Waiting..."}</strong></div>
          <div><span>PAYER</span><strong>{formData.payerName || "Guest"}</strong></div>
          <div><span>PENALTY RULE</span><strong>{formatAmount(formData.penaltyAmount)} every {formData.penaltyTime || 0}m</strong></div>
        </div>
      </aside>
    </section>
  );
}