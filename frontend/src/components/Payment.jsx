import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { QRCodeCanvas } from "qrcode.react";
import "./Payment.css";

const TimerIcon = () => (
  <svg className="timer-icon" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"></path></svg>
);

export default function Payment() {
  const { linkId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [currentAmount, setCurrentAmount] = useState(0);
  const [timeLeft, setTimeLeft] = useState("00:00");
  const [isPaid, setIsPaid] = useState(false);
  const prevAmount = useRef(0);

  // File Upload States
  const [screenshot, setScreenshot] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchPaymentInfo = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/payment-info/${linkId}`);
        if (res.data.success) {
          if (res.data.data.status === "paid") {
            setError("❌ Yeh payment link expire ho chuki hai.");
            return;
          }
          setData(res.data.data);
          setCurrentAmount(res.data.data.basePrice);
          prevAmount.current = res.data.data.basePrice;
        }
      } catch (err) {
        setError("❌ Invalid or expired link.");
      }
    };
    fetchPaymentInfo();
  }, [linkId]);

  useEffect(() => {
    if (!data || isPaid) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsedMs = now - data.createdAt;
      
      const pTime = data.penaltyTime || 10;
      const pAmt = data.penaltyAmount || 10;
      const msInInterval = pTime * 60 * 1000;

      const elapsedMinutes = Math.floor(elapsedMs / 60000);
      const penaltySteps = Math.floor(elapsedMinutes / pTime);
      const newAmount = data.basePrice + (penaltySteps * pAmt);

      setCurrentAmount(newAmount);
      prevAmount.current = newAmount;

      const timeToNextBump = msInInterval - (elapsedMs % msInInterval);
      if (timeToNextBump < 0) return;

      const minutesLeft = Math.floor(timeToNextBump / 60000);
      const secondsLeft = Math.floor((timeToNextBump % 60000) / 1000);
      setTimeLeft(`${minutesLeft.toString().padStart(2, "0")}:${secondsLeft.toString().padStart(2, "0")}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [data, isPaid]);

  const handleFileChange = (e) => setScreenshot(e.target.files[0]);

  const handleSubmitPayment = async () => {
    if (!screenshot) return alert("Please upload a payment screenshot first!");
    
    setUploading(true);
    try {
      // 1. Upload to ImgBB
      const imgData = new FormData();
      imgData.append("image", screenshot);
      
      // YAHAN APNI IMGBB API KEY DAALEIN
      const imgbbRes = await axios.post("https://api.imgbb.com/1/upload?key=5c8a9e24ee14dfcf633871c8d058df40", imgData);
      const uploadedUrl = imgbbRes.data.data.url;

      // 2. Update Firebase via Backend
      await axios.post("http://localhost:5000/api/mark-paid", {
        linkId,
        screenshotUrl: uploadedUrl,
        finalAmount: currentAmount
      });

      setIsPaid(true); // Expire link locally
    } catch (error) {
      alert("Error uploading screenshot or updating backend.");
    } finally {
      setUploading(false);
    }
  };

  if (error) return <div className="payment-wrapper"><div className="payment-card"><div className="error-msg">{error}</div></div></div>;
  if (!data) return <div className="payment-wrapper"><div className="loading">Loading...</div></div>;

  const upiString = `upi://pay?pa=${data.upiId}&pn=${data.payerName}&am=${currentAmount}&cu=INR`;
  const pAmt = data.penaltyAmount || 10;

  return (
    <div className="payment-wrapper">
      <div className="payment-card">
        {isPaid ? (
          <div className="success-state">
            <h1 style={{ color: "#28a745", fontSize: "48px", margin: "10px 0" }}>✓</h1>
            <h2 style={{ color: "#28a745" }}>Verification Pending</h2>
            <p style={{ color: "#555", marginTop: "10px" }}>Aapka screenshot upload ho gaya hai. Hum jaldi hi verify karenge.</p>
          </div>
        ) : (
          <>
            <div className="receiver-info">
              <p className="receiver-title">Paying To UPI ID</p>
              <p className="receiver-name">{data.upiId}</p>
            </div>

            <div className="amount-section">
              <p className="payer-greeting">Hello, <span className="payer-name">{data.payerName}</span>!</p>
              <p className="current-amount">₹{currentAmount}</p>
              
              <div className="timer-container">
                <TimerIcon />
                <span>Price increases by ₹{pAmt} in: <span className="timer-text">{timeLeft}</span></span>
              </div>
            </div>

            <div className="qr-container">
              <QRCodeCanvas value={upiString} size={150} bgColor={"#ffffff"} fgColor={"#1a2a47"} level="M" includeMargin={true}/>
              <p className="scan-instruction">Scan to Pay via UPI</p>
            </div>

            {/* NEW: Screenshot Upload Section */}
            <div style={{ marginTop: "20px", textAlign: "left", background: "#f8f9fa", padding: "15px", borderRadius: "10px", border: "1px solid #ddd" }}>
              <label style={{ fontSize: "14px", fontWeight: "bold", color: "#333", display: "block", marginBottom: "8px" }}>
                Upload Payment Screenshot <span style={{ color: "red" }}>*</span>
              </label>
              <input type="file" accept="image/*" onChange={handleFileChange} style={{ width: "100%", fontSize: "14px" }} />
            </div>

            <button 
              onClick={handleSubmitPayment} 
              disabled={uploading}
              style={{ width: "100%", marginTop: "15px", padding: "14px", background: "#28a745", color: "white", border: "none", borderRadius: "10px", fontSize: "16px", fontWeight: "bold", cursor: "pointer", transition: "0.3s" }}
            >
              {uploading ? "Uploading & Verifying..." : "Mark as Paid"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}