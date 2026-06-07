import { useState } from "react";
import axios from "axios";
import "./CreatePayment.css";

export default function CreatePayment() {
  const [formData, setFormData] = useState({
    upiId: "",
    basePrice: "",
    payerName: "",
    payerNumber: "",
    penaltyAmount: 10,
    penaltyTime: 10,
  });

  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const formatAmount = (value) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(value) || 0);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setCopied(false);

    try {
      const response = await axios.post("https://payment-web-1tfd.onrender.com/api/create-link", formData);
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

  const projectedAmount = (Number(formData.basePrice) || 0) + (Number(formData.penaltyAmount) || 0);

  return (
    <section className="create-pay">
      <div className="create-form-card">
        <div className="create-heading">
          <div>
            <span>New payment link</span>
            <h2>Build a payable link</h2>
          </div>
          <p>Enter UPI, payer, and penalty details. The backend flow remains unchanged.</p>
        </div>

        <form onSubmit={handleCreate} className="create-grid">
          <label className="create-field">
            <span>Receiver UPI ID</span>
            <input
              name="upiId"
              value={formData.upiId}
              onChange={handleChange}
              placeholder="merchant@upi"
              required
            />
          </label>

          <label className="create-field">
            <span>Base Price</span>
            <input
              name="basePrice"
              type="number"
              value={formData.basePrice}
              onChange={handleChange}
              placeholder="2500"
              required
            />
          </label>

          <label className="create-field">
            <span>Payer Name</span>
            <input
              name="payerName"
              value={formData.payerName}
              onChange={handleChange}
              placeholder="Customer name"
            />
          </label>

          <label className="create-field">
            <span>Payer WhatsApp</span>
            <input
              name="payerNumber"
              value={formData.payerNumber}
              onChange={handleChange}
              placeholder="9876543210"
            />
          </label>

          <div className="rule-box">
            <div className="rule-copy">
              <strong>Penalty rule</strong>
              <small>Price increases by the penalty amount after every interval.</small>
            </div>

            <label className="create-field">
              <span>Penalty Amount</span>
              <input
                name="penaltyAmount"
                type="number"
                value={formData.penaltyAmount}
                onChange={handleChange}
              />
            </label>

            <label className="create-field">
              <span>Interval Minutes</span>
              <input
                name="penaltyTime"
                type="number"
                value={formData.penaltyTime}
                onChange={handleChange}
              />
            </label>
          </div>

          <button type="submit" className="create-submit" disabled={loading}>
            {loading ? "Creating secure link..." : "Generate Payment Link"}
          </button>
        </form>

        {link && (
          <div className="created-link-box">
            <div>
              <span>Generated URL</span>
              <a href={link} target="_blank" rel="noreferrer">{link}</a>
            </div>

            <div className="link-actions">
              <button onClick={copyLink} type="button">{copied ? "Copied" : "Copy"}</button>
              <a href={link} target="_blank" rel="noreferrer">Open</a>
            </div>
          </div>
        )}
      </div>

      <aside className="create-preview-card">
        <div className="preview-strip">
          <span>Checkout preview</span>
          <strong>UPI</strong>
        </div>

        <div className="preview-price">{formatAmount(formData.basePrice)}</div>

        <div className="preview-stack">
          <div>
            <span>Receiver</span>
            <strong>{formData.upiId || "UPI ID pending"}</strong>
          </div>
          <div>
            <span>Payer</span>
            <strong>{formData.payerName || "Guest payer"}</strong>
          </div>
          <div>
            <span>Penalty rule</span>
            <strong>{formatAmount(formData.penaltyAmount)} every {formData.penaltyTime || 0}m</strong>
          </div>
          <div>
            <span>After first penalty</span>
            <strong>{formatAmount(projectedAmount)}</strong>
          </div>
        </div>
      </aside>
    </section>
  );
}