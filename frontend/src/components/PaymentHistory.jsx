import { useState, useEffect } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import "./PaymentHistory.css";

export default function PaymentHistory() {
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await axios.get("https://payment-web-1tfd.onrender.com/api/history");
        if (res.data.success) setHistory(res.data.data);
      } catch (err) {
        console.error("History fetch error");
      }
    };
    fetchHistory();
  }, []);

  const formatAmount = (value) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(value) || 0);
  };

  const formatPdfAmount = (value) => {
    return "Rs. " + new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Number(value) || 0);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = new Date(timestamp);
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleReceipt = (item, action) => {
    const doc = new jsPDF();

    doc.setFillColor(21, 19, 15);
    doc.rect(0, 0, 210, 34, "F");
    doc.setTextColor(255, 248, 231);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("PAYMENT RECEIPT", 14, 22);

    doc.setTextColor(40, 40, 40);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Receipt ID: TXN-${item.id.substring(0, 8).toUpperCase()}`, 14, 46);
    doc.text(`Date & Time: ${formatDate(item.paidAt || item.createdAt)}`, 14, 53);
    doc.text(`Status: ${item.status.toUpperCase()}`, 14, 60);

    doc.setFont("helvetica", "bold");
    doc.text("Billed To:", 14, 72);
    doc.setFont("helvetica", "normal");
    doc.text(`Name: ${item.payerName || "Guest"}`, 14, 79);
    doc.text(`Phone: ${item.payerNumber || "N/A"}`, 14, 86);

    doc.setFont("helvetica", "bold");
    doc.text("Paid To UPI:", 120, 72);
    doc.setFont("helvetica", "normal");
    doc.text(item.upiId || "N/A", 120, 79);

    const tableData = [
      ["Base Amount", formatPdfAmount(item.basePrice)],
      [`Dynamic Penalty (${item.penaltyAmount} per ${item.penaltyTime}m)`, formatPdfAmount((item.paidAmount || item.basePrice) - item.basePrice)],
    ];

    autoTable(doc, {
      startY: 96,
      head: [["Description", "Amount"]],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [21, 19, 15], textColor: [255, 248, 231] },
      styles: { fontSize: 10, cellPadding: 5 },
      columnStyles: { 1: { halign: "right", fontStyle: "bold" } },
    });

    const finalY = doc.lastAutoTable.finalY + 12;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Total Paid:", 130, finalY);
    doc.setTextColor(8, 116, 67);
    doc.setFontSize(14);
    doc.text(formatPdfAmount(item.paidAmount || item.basePrice), 195, finalY, { align: "right" });

    doc.setTextColor(50, 50, 50);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Payment Proof Reference:", 14, finalY + 15);

    if (item.screenshotUrl) {
      doc.setTextColor(15, 118, 110);
      doc.textWithLink("Click here to view original screenshot", 14, finalY + 22, { url: item.screenshotUrl });
    } else {
      doc.text("Not provided", 14, finalY + 22);
    }

    doc.setTextColor(130, 130, 130);
    doc.setFontSize(9);
    doc.text("Electronically generated receipt by Dynamic UPI Console.", 105, 280, { align: "center" });

    if (action === "view") {
      window.open(doc.output("bloburl"), "_blank");
    } else {
      doc.save(`Receipt_${item.payerName || "Payment"}_${item.id.substring(0, 5)}.pdf`);
    }
  };

  const paidCount = history.filter((item) => item.status === "paid").length;
  const pendingCount = history.length - paidCount;
  const paidAmount = history
    .filter((item) => item.status === "paid")
    .reduce((sum, item) => sum + (Number(item.paidAmount) || 0), 0);

  return (
    <section className="ledger-section">
      <div className="ledger-summary">
        <div><span>Total Links</span><strong>{history.length}</strong></div>
        <div><span>Paid</span><strong>{paidCount}</strong></div>
        <div><span>Pending</span><strong>{pendingCount}</strong></div>
        <div><span>Collected</span><strong>{formatAmount(paidAmount)}</strong></div>
      </div>

      <div className="ledger-head">
        <div>
          <span>Transaction ledger</span>
          <h2>Payment History</h2>
        </div>
        <p>Receipt, proof, payer and penalty details in one compact list.</p>
      </div>

      <div className="ledger-list">
        {history.map((item) => (
          <article className="ledger-row" key={item.id}>
            <div className="ledger-person">
              <div className="ledger-avatar">{(item.payerName || "G").charAt(0).toUpperCase()}</div>
              <div>
                <strong>{item.payerName || "Guest"}</strong>
                <span>{item.payerNumber || "No contact"}</span>
                <small>{formatDate(item.createdAt)}</small>
              </div>
            </div>

            <div className="ledger-detail">
              <span>Base</span>
              <strong>{formatAmount(item.basePrice)}</strong>
              <small>{item.upiId}</small>
            </div>

            <div className="ledger-status">
              <span className={`ledger-badge ${item.status === "paid" ? "paid" : "pending"}`}>
                {item.status.toUpperCase()}
              </span>
              <small>Penalty every {item.penaltyTime}m</small>
            </div>

            <div className="ledger-actions">
              {item.status === "paid" ? (
                <>
                  <strong className="ledger-paid">{formatAmount(item.paidAmount)}</strong>
                  <div>
                    {item.screenshotUrl && (
                      <a href={item.screenshotUrl} target="_blank" rel="noreferrer">Proof</a>
                    )}
                    <button onClick={() => handleReceipt(item, "view")}>View</button>
                    <button onClick={() => handleReceipt(item, "download")}>PDF</button>
                  </div>
                </>
              ) : (
                <span className="waiting-text">Waiting for payment</span>
              )}
            </div>
          </article>
        ))}
      </div>

      {history.length === 0 && (
        <div className="ledger-empty">
          <strong>No records found</strong>
          <p>Payment records will appear here after links are created.</p>
        </div>
      )}
    </section>
  );
}