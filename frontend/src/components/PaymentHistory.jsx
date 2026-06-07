import { useState, useEffect } from "react";
import axios from "axios";
import jsPDF from "jspdf";
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

  // PERFECTLY ALIGNED CHECKBOOK STYLE PDF
  const handleReceipt = (item, action) => {
    const doc = new jsPDF({ orientation: "landscape", format: [210, 110] });

    // Grid Coordinates (Millimeters)
    const startX = 10;
    const startY = 10;
    const endX = 200; // 10 (Left Margin) + 190 (Width)
    
    // Column positions
    const col1 = 15; // Label start
    const col2 = 45; // Colon ":" position
    const col3 = 50; // Text Value start
    const colRight = 155; // Right Boxes Start
    
    // Row Lines (Y coordinates)
    const rowHeader = 32;
    const row1 = 45;
    const row2 = 60;
    const row3 = 75;
    const rowFooter = 88;

    // 1. OUTER BLACK BORDER
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.4);
    doc.rect(startX, startY, 190, 90);

    // 2. HEADER SECTION
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("PAYMENT RECEIPT", col1, 24);

    // No & Date
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    doc.text("No", 125, 18);
    doc.text(":", 135, 18);
    doc.text(`TXN-${item.id.substring(0, 8).toUpperCase()}`, 140, 18);
    
    doc.setDrawColor(91, 155, 213); // Light Blue Lines
    doc.setLineWidth(0.2);
    doc.line(140, 20, 195, 20); // Exact line under text

    doc.text("Date", 125, 26);
    doc.text(":", 135, 26);
    doc.text(formatDate(item.paidAt || item.createdAt), 140, 26);
    doc.line(140, 28, 195, 28);

    // Header Separator Line
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(startX, rowHeader, endX, rowHeader);

    // 3. ROW 1: RECEIVED FROM
    doc.setFontSize(10);
    doc.text("Received From", col1, 40);
    doc.text(":", col2, 40);
    doc.text(`${item.payerName || "Guest"} (${item.payerNumber || "N/A"})`, col3, 40);

    // Row 1 Blue Line (Spans full width)
    doc.setDrawColor(91, 155, 213);
    doc.setLineWidth(0.2);
    doc.line(startX, row1, endX, row1);

    // 4. ROW 2: AMOUNT
    doc.setTextColor(0, 0, 0);
    doc.text("Amount", col1, 54);
    doc.text(":", col2, 54);

    const totalAmount = item.paidAmount || item.basePrice;
    
    // Amount in Words (Blue Italic)
    doc.setTextColor(91, 155, 213);
    doc.setFont("helvetica", "italic");
    doc.text(numberToWords(totalAmount), col3, 54);

    // Numeric Amount Box (Light Blue)
    doc.setFillColor(218, 227, 243); 
    doc.setDrawColor(91, 155, 213);
    doc.setLineWidth(0.3);
    doc.rect(colRight, row1, 45, 15, "FD"); // Fits exactly between row1 and row2

    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("Rs.", colRight + 3, 55);
    doc.text(new Intl.NumberFormat("en-IN").format(totalAmount), colRight + 42, 55, { align: "right" });

    // Row 2 Blue Line (Stops at the right box)
    doc.setLineWidth(0.2);
    doc.line(startX, row2, colRight, row2);

    // 5. ROW 3: PAYMENT FOR
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Payment For", col1, 69);
    doc.text(":", col2, 69);
    doc.text(`Base Amount + Penalty (${item.penaltyAmount} per ${item.penaltyTime}m)`, col3, 69);

    // Row 3 Blue Line (Stops at the right box)
    doc.line(startX, row3, colRight, row3);

    // 6. ROW 4: RECEIVED BY & SIGN BOX
    doc.text("Received By", col1, 83);
    doc.text(":", col2, 83);
    doc.text(item.upiId || "N/A", col3, 83);

    // Sign Box (Empty)
    doc.setDrawColor(91, 155, 213);
    doc.rect(colRight, row2, 45, 28, "D"); // Fits exactly between row2 and Footer
    doc.text("Sign", colRight + 22.5, 85, { align: "center" });

    // 7. BOTTOM BLUE BANNER (Footer)
    doc.setFillColor(91, 155, 213);
    doc.rect(startX, rowFooter, 190, 12, "F"); // 12mm height footer

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