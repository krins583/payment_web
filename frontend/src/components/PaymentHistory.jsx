import { useState, useEffect } from "react";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import "./PaymentHistory.css";

export default function PaymentHistory() {
  const [history, setHistory] = useState([]);
  const [copiedId, setCopiedId] = useState(null);
  
  const [dateFilter, setDateFilter] = useState("all");
  const [amountFilter, setAmountFilter] = useState("all");

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
    // Har 1 minute mein ek baar refresh hoga, jo ki practical aur light hai
const intervalId = setInterval(() => { fetchHistory(); }, 60000);
    return () => clearInterval(intervalId);
  }, []);

  const formatAmount = (value) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(value) || 0);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = new Date(timestamp);
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  const numberToWords = (num) => {
    if (num === 0) return "Zero";
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    if ((num = num.toString()).length > 9) return 'Overflow';
    let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return '';
    let str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
    str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + 'Only' : 'Only';
    return str;
  };

  const handleCopyLink = async (linkId) => {
    const url = `${window.location.origin}/pay/${linkId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(linkId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      alert("Failed to copy link");
    }
  };

  const handleDelete = async (linkId) => {
    if (!window.confirm("Are you sure you want to delete this payment record?")) return;
    try {
      const res = await axios.delete(`https://payment-web-1tfd.onrender.com/api/delete-link/${linkId}`);
      if (res.data.success) {
        setHistory(history.filter(item => item.id !== linkId));
      } else {
        alert("Could not delete. Try again.");
      }
    } catch (error) {
      console.error("Delete error", error);
      alert("Error deleting the link");
    }
  };

  // NAYA FEATURE: WHATSAPP AUTO-DRAFT REMINDER
  const handleSendReminder = (item) => {
    if (!item.payerNumber) {
      alert("Payer WhatsApp number is not available for this link!");
      return;
    }
    
    const link = `${window.location.origin}/pay/${item.id}`;
    const message = `Hello ${item.payerName || 'there'},\n\nThis is an automated reminder that your payment of Rs. ${item.basePrice} is currently pending.\n\n⚠️ *Important Notice:* A penalty of Rs. ${item.penaltyAmount} is being added every ${item.penaltyTime} minutes for late payment.\n\nPlease complete your payment securely using the link below:\n${link}\n\nThank you.`;
    
    const encodedMessage = encodeURIComponent(message);
    
    // Number format setup
    let phone = item.payerNumber.replace(/\D/g, '');
    if (phone.length === 10) phone = '91' + phone; // Auto add Indian code if missing
    
    window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
  };

  const getFilteredData = () => {
    const now = Date.now();
    return history.filter((item) => {
      let dateMatch = true;
      if (dateFilter === "today") dateMatch = (now - item.createdAt) <= 86400000;
      else if (dateFilter === "7days") dateMatch = (now - item.createdAt) <= 7 * 86400000;
      else if (dateFilter === "30days") dateMatch = (now - item.createdAt) <= 30 * 86400000;

      let amtMatch = true;
      const amt = item.paidAmount || item.basePrice;
      if (amountFilter === "under500") amtMatch = amt < 500;
      else if (amountFilter === "500-2000") amtMatch = amt >= 500 && amt <= 2000;
      else if (amountFilter === "over2000") amtMatch = amt > 2000;

      return dateMatch && amtMatch;
    });
  };

  const filteredHistory = getFilteredData();

  const exportExcel = () => {
    const dataToExport = filteredHistory.map((item, index) => ({
      "S.No": index + 1,
      "Date & Time": new Date(item.createdAt).toLocaleString("en-IN"),
      "Payer Name": item.payerName || "Guest",
      "Payer Mobile": item.payerNumber || "N/A",
      "Status": item.status.toUpperCase(),
      "Base Amount (Rs)": item.basePrice,
      "Penalty Amount (Rs)": item.paidAmount ? item.paidAmount - item.basePrice : 0,
      "Total Paid (Rs)": item.paidAmount || 0,
      "Transaction ID / UTR": item.utrNumber || "Not Scanned/Available",
      "Receiver UPI ID": item.upiId || "N/A",
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Payment History");
    XLSX.writeFile(workbook, "DASH_Payment_Report.xlsx");
  };

  const exportPDFList = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 118, 110);
    doc.text("DASH UPI Console - Payment Report", 14, 20);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleString("en-IN")}`, 14, 28);

    const tableData = filteredHistory.map((item, index) => [
      index + 1,
      new Date(item.createdAt).toLocaleDateString("en-IN"),
      item.payerName || "Guest",
      `Rs. ${item.paidAmount || item.basePrice}`,
      item.status.toUpperCase(),
      item.utrNumber || "N/A",
      item.upiId || "N/A"
    ]);

    autoTable(doc, {
      startY: 35,
      head: [["S.No", "Date", "Payer Name", "Total Amount", "Status", "TXN ID (UTR)", "UPI ID"]],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [15, 118, 110], textColor: [255, 255, 255], fontStyle: "bold" },
      styles: { fontSize: 9, cellPadding: 4 },
      columnStyles: { 0: { cellWidth: 15 } }
    });

    doc.save("DASH_Payment_Report.pdf");
  };

  const handleReceipt = (item, action) => {
    const doc = new jsPDF({ orientation: "landscape", format: [210, 110] });

    const startX = 10;
    const innerW = 190;
    const endX = 200; 
    const colLabel = 15;
    const colColon = 42;
    const colValue = 46;
    const boxX = 155; 
    const boxW = 45;

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.4);
    doc.rect(startX, 10, innerW, 90);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("PAYMENT RECEIPT", colLabel, 24);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("No", 125, 18);
    doc.text(":", 135, 18);
    
    const displayId = item.utrNumber || `TXN-${item.id.substring(0, 8).toUpperCase()}`;
    if (displayId.length > 15) {
      doc.setFontSize(8);
      doc.text(displayId, 140, 18);
      doc.setFontSize(10);
    } else {
      doc.text(displayId, 140, 18);
    }
    
    doc.setDrawColor(91, 155, 213); 
    doc.setLineWidth(0.2);
    doc.line(140, 20, 195, 20); 

    doc.text("Date", 125, 26);
    doc.text(":", 135, 26);
    doc.text(formatDate(item.paidAt || item.createdAt), 140, 26);
    doc.line(140, 28, 195, 28);

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.4);
    doc.line(startX, 32, endX, 32);

    const line1Y = 46;
    doc.setFontSize(10);
    doc.text("Received From", colLabel, 40);
    doc.text(":", colColon, 40);
    doc.text(`${item.payerName || "Guest"} (${item.payerNumber || "N/A"})`, colValue, 40);
    
    doc.setDrawColor(91, 155, 213);
    doc.setLineWidth(0.2);
    doc.line(startX, line1Y, endX, line1Y); 

    const line2Y = 62;
    doc.setTextColor(0, 0, 0);
    doc.text("Amount", colLabel, 55);
    doc.text(":", colColon, 55);

    const totalAmount = item.paidAmount || item.basePrice;
    
    doc.setTextColor(91, 155, 213);
    doc.setFont("helvetica", "italic");
    const words = doc.splitTextToSize(numberToWords(totalAmount), boxX - colValue - 5);
    doc.text(words, colValue, 55);

    doc.setFillColor(218, 227, 243); 
    doc.setDrawColor(91, 155, 213);
    doc.setLineWidth(0.3);
    doc.rect(boxX, line1Y, boxW, line2Y - line1Y, "FD");

    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Rs.", boxX + 4, 56);
    doc.text(new Intl.NumberFormat("en-IN").format(totalAmount), boxX + boxW - 4, 56, { align: "right" });

    doc.setLineWidth(0.2);
    doc.line(startX, line2Y, boxX, line2Y);

    const line3Y = 78;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Payment For", colLabel, 71);
    doc.text(":", colColon, 71);
    doc.text(`Base Amount + Penalty (${item.penaltyAmount} per ${item.penaltyTime}m)`, colValue, 71);

    doc.line(startX, line3Y, boxX, line3Y);

    const footerY = 88;
    doc.text("Received By", colLabel, 84);
    doc.text(":", colColon, 84);
    doc.text(item.upiId || "N/A", colValue, 84);

    doc.setDrawColor(91, 155, 213);
    doc.rect(boxX, line2Y, boxW, footerY - line2Y, "D"); 
    doc.text("Sign", boxX + (boxW / 2), footerY - 4, { align: "center" });

    doc.setFillColor(91, 155, 213);
    doc.rect(startX, footerY, innerW, 12, "F"); 

    if (item.screenshotUrl) {
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.textWithLink("View Verification Screenshot (Payment Proof)", 105, 96, { url: item.screenshotUrl, align: "center" });
    }

    if (action === "view") {
      window.open(doc.output("bloburl"), "_blank");
    } else {
      doc.save(`Receipt_${item.payerName || "Payment"}_${item.id.substring(0, 5)}.pdf`);
    }
  };

  const paidCount = filteredHistory.filter((item) => item.status === "paid").length;
  const pendingCount = filteredHistory.length - paidCount;
  const paidAmount = filteredHistory
    .filter((item) => item.status === "paid")
    .reduce((sum, item) => sum + (Number(item.paidAmount) || 0), 0);

  return (
    <section className="ledger-section">
      <div className="ledger-summary">
        <div><span>Total Links</span><strong>{filteredHistory.length}</strong></div>
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

      <div className="ledger-controls">
        <div className="filter-group">
          <div className="filter-item">
            <select value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
            </select>
          </div>
          <div className="filter-item">
            <select value={amountFilter} onChange={(e) => setAmountFilter(e.target.value)}>
              <option value="all">All Amounts</option>
              <option value="under500">Under ₹500</option>
              <option value="500-2000">₹500 - ₹2000</option>
              <option value="over2000">Above ₹2000</option>
            </select>
          </div>
        </div>

        <div className="export-group">
          <button onClick={exportPDFList} className="btn-export pdf">
             PDF Export
          </button>
          <button onClick={exportExcel} className="btn-export excel">
             Excel Export
          </button>
        </div>
      </div>

      <div className="ledger-list">
        {filteredHistory.map((item) => (
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
              <small>{item.utrNumber || item.upiId}</small>
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
                <div className="pending-actions">
                  <span className="waiting-text">Waiting for payment</span>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                    {/* NAYA WHATSAPP REMINDER BUTTON */}
                    <button onClick={() => handleSendReminder(item)} className="btn-remind">
                       WA Remind
                    </button>
                    <button onClick={() => handleCopyLink(item.id)} className="btn-copy">
                      {copiedId === item.id ? "Copied!" : "Copy"}
                    </button>
                    <button onClick={() => handleDelete(item.id)} className="btn-delete">
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>

      {filteredHistory.length === 0 && (
        <div className="ledger-empty">
          <strong>No records found</strong>
          <p>Try adjusting your filters or wait for new payments.</p>
        </div>
      )}
    </section>
  );
}