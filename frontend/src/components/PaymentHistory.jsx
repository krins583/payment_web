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
        const res = await axios.get("http://localhost:5000/api/history");
        if (res.data.success) setHistory(res.data.data);
      } catch (err) {
        console.error("History fetch error");
      }
    };
    fetchHistory();
  }, []);

  // Web UI ke liye (₹ symbol ke sath)
  const formatAmount = (value) => {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(value) || 0);
  };

  // PDF ke liye (Rs. likha aayega taaki jsPDF mein bug na aaye)
  const formatPdfAmount = (value) => {
    return "Rs. " + new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Number(value) || 0);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = new Date(timestamp);
    return date.toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    });
  };

  // PDF GENERATION LOGIC - Aesthetic and Compact
  const handleReceipt = (item, action) => {
    const doc = new jsPDF();
    
    // Header - Margin Kam Kiya
    doc.setFillColor(23, 105, 232);
    doc.rect(0, 0, 210, 30, 'F'); // Pehle 40 tha, ab 30 kar diya
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("PAYMENT RECEIPT", 14, 20); // Upar shift kiya
    
    // Receipt Details - Spacing Kam Ki
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Receipt ID: TXN-${item.id.substring(0, 8).toUpperCase()}`, 14, 42);
    doc.text(`Date & Time: ${formatDate(item.paidAt || item.createdAt)}`, 14, 48);
    doc.text(`Status: ${item.status.toUpperCase()}`, 14, 54);

    // Payer & Receiver Info
    doc.setFont("helvetica", "bold");
    doc.text("Billed To:", 14, 66);
    doc.setFont("helvetica", "normal");
    doc.text(`Name: ${item.payerName || "Guest"}`, 14, 72);
    doc.text(`Phone: ${item.payerNumber || "N/A"}`, 14, 78);

    doc.setFont("helvetica", "bold");
    doc.text("Paid To (UPI):", 120, 66);
    doc.setFont("helvetica", "normal");
    doc.text(item.upiId, 120, 72);

    // Table for Amount Breakdown (Rs. Format Use Kiya Hai)
    const tableData = [
      ["Base Amount", formatPdfAmount(item.basePrice)],
      [`Dynamic Penalty (${item.penaltyAmount} per ${item.penaltyTime}m)`, formatPdfAmount((item.paidAmount || item.basePrice) - item.basePrice)],
    ];

    autoTable(doc, {
      startY: 88, // Table ko upar shift kiya
      head: [["Description", "Amount"]],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [23, 105, 232] },
      styles: { fontSize: 10, cellPadding: 5 },
      columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } }
    });

    // Final Total
    const finalY = doc.lastAutoTable.finalY + 12;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Total Paid:", 130, finalY);
    
    doc.setTextColor(10, 143, 99); // Green color
    doc.setFontSize(14);
    doc.text(formatPdfAmount(item.paidAmount || item.basePrice), 195, finalY, { align: "right" });

    // Payment Proof Link
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Payment Proof Reference:", 14, finalY + 15);
    
    if (item.screenshotUrl) {
      doc.setTextColor(23, 105, 232);
      doc.textWithLink("Click here to view original screenshot", 14, finalY + 21, { url: item.screenshotUrl });
    } else {
      doc.text("Not provided", 14, finalY + 21);
    }

    // Footer
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(9);
    doc.text("This is an electronically generated receipt by QRPay System.", 105, 280, { align: "center" });

    // Action Check: View or Download
    if (action === "view") {
      window.open(doc.output("bloburl"), "_blank");
    } else {
      doc.save(`Receipt_${item.payerName || 'Payment'}_${item.id.substring(0, 5)}.pdf`);
    }
  };

  const paidCount = history.filter((item) => item.status === "paid").length;
  const pendingCount = history.length - paidCount;
  const paidAmount = history.filter((item) => item.status === "paid").reduce((sum, item) => sum + (Number(item.paidAmount) || 0), 0);

  return (
    <section className="history-section">
      <div className="summary-grid">
        <div className="summary-card blue"><span>Total Links</span><strong>{history.length}</strong></div>
        <div className="summary-card green"><span>Paid</span><strong>{paidCount}</strong></div>
        <div className="summary-card amber"><span>Pending</span><strong>{pendingCount}</strong></div>
        <div className="summary-card"><span>Collected</span><strong>{formatAmount(paidAmount)}</strong></div>
      </div>

      <div className="history-toolbar">
        <div>
          <span style={{color: "#1769e8", fontWeight: "bold", fontSize:"12px"}}>RECORDS</span>
          <h2>Payment History</h2>
        </div>
      </div>

      <div className="history-list">
        {history.map((item) => (
          <div className="history-row" key={item.id}>
            
            {/* Payer Detail Column */}
            <div className="payer-col">
              <div className="payer-avatar">{(item.payerName || "G").charAt(0).toUpperCase()}</div>
              <div className="payer-info">
                <strong>{item.payerName || "Guest"}</strong>
                <span>{item.payerNumber || "No contact"}</span>
                <span style={{color: "#9aa6b7", fontSize: "11px", fontWeight: "600"}}>
                  {formatDate(item.createdAt)}
                </span>
              </div>
            </div>

            {/* Config & UPI Column */}
            <div className="details-col">
              <span>Configuration</span>
              <strong>{formatAmount(item.basePrice)} Base</strong>
              <span style={{marginTop: "5px"}}>UPI ID</span>
              <strong>{item.upiId}</strong>
            </div>

            {/* Status Column */}
            <div className="status-col">
              <span className={`status-badge ${item.status === "paid" ? "status-paid" : "status-pending"}`}>
                {item.status.toUpperCase()}
              </span>
              <div style={{fontSize: "11px", color: "#8a96a8", fontWeight: "bold"}}>
                Penalty: {item.penaltyTime}m
              </div>
            </div>

            {/* Actions & Final Amount Column */}
            <div className="action-col">
              {item.status === "paid" ? (
                <>
                  <div className="final-amount">{formatAmount(item.paidAmount)}</div>
                  <div className="btn-group">
                    {item.screenshotUrl && (
                      <a href={item.screenshotUrl} target="_blank" rel="noreferrer" className="action-btn btn-view">
                        Proof
                      </a>
                    )}
                    <button onClick={() => handleReceipt(item, "view")} className="action-btn btn-pdf-view">
                      View Receipt
                    </button>
                    <button onClick={() => handleReceipt(item, "download")} className="action-btn btn-pdf-down">
                      Download
                    </button>
                  </div>
                </>
              ) : (
                <div style={{color: "#9aa6b7", fontSize: "13px", fontWeight: "bold"}}>Waiting for payment...</div>
              )}
            </div>

          </div>
        ))}
      </div>
      
      {history.length === 0 && (
        <div style={{textAlign:"center", padding:"40px", color:"#68768a", fontWeight:"bold"}}>
          No records found.
        </div>
      )}
    </section>
  );
}