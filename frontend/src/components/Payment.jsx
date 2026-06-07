import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { QRCodeCanvas } from "qrcode.react";
import "./Payment.css";

const TimerIcon = () => (
  <svg className="checkout-timer-icon" fill="currentColor" viewBox="0 0 20 20">
    <path
      fillRule="evenodd"
      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
      clipRule="evenodd"
    />
  </svg>
);

export default function Payment() {
  const { linkId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [currentAmount, setCurrentAmount] = useState(0);
  const [timeLeft, setTimeLeft] = useState("00:00");
  const [isPaid, setIsPaid] = useState(false);
  const prevAmount = useRef(0);

  const [screenshot, setScreenshot] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchPaymentInfo = async () => {
      try {
        const res = await axios.get(`https://payment-web-1tfd.onrender.com/api/payment-info/${linkId}`);
        if (res.data.success) {
          if (res.data.data.status === "paid") {
            setError("This payment link has already been completed.");
            return;
          }
          setData(res.data.data);
          setCurrentAmount(res.data.data.basePrice);
          prevAmount.current = res.data.data.basePrice;
        }
      } catch (err) {
        setError("Invalid or expired payment link.");
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
      const newAmount = data.basePrice + penaltySteps * pAmt;

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
    if (!screenshot) return alert("Please upload a payment screenshot first.");

    setUploading(true);

    try {
      const imgData = new FormData();
      imgData.append("image", screenshot);

      const imgbbRes = await axios.post(
        "https://api.imgbb.com/1/upload?key=5c8a9e24ee14dfcf633871c8d058df40",
        imgData
      );
      const uploadedUrl = imgbbRes.data.data.url;

      await axios.post("https://payment-web-1tfd.onrender.com/api/mark-paid", {
        linkId,
        screenshotUrl: uploadedUrl,
        finalAmount: currentAmount,
      });

      setIsPaid(true);
    } catch (error) {
      alert("Error uploading screenshot or updating backend.");
    } finally {
      setUploading(false);
    }
  };

  if (error) {
    return (
      <div className="checkout-page">
        <div className="checkout-state-card error">
          <strong>{error}</strong>
          <span>Please contact the payment owner for a fresh link.</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="checkout-page">
        <div className="checkout-state-card">
          <strong>Loading payment...</strong>
          <span>Fetching secure checkout details.</span>
        </div>
      </div>
    );
  }

  const upiString = `upi://pay?pa=${data.upiId}&pn=${data.payerName}&am=${currentAmount}&cu=INR`;
  const pAmt = data.penaltyAmount || 10;

  return (
    <div className="checkout-page">
      <section className="checkout-card">
        {isPaid ? (
          <div className="checkout-success">
            <div className="success-mark">✓</div>
            <h1>Verification pending</h1>
            <p>Your screenshot has been uploaded. The payment owner will verify it shortly.</p>
          </div>
        ) : (
          <>
            <header className="checkout-header">
              <span>Secure UPI checkout</span>
              <h1>Complete your payment</h1>
              <p>Pay the exact amount shown below and upload your screenshot for verification.</p>
            </header>

            <div className="checkout-amount-block">
              <div>
                <span>Amount due</span>
                <strong>₹{currentAmount}</strong>
              </div>

              <div className="timer-pill">
                <TimerIcon />
                <span>+₹{pAmt} in <b>{timeLeft}</b></span>
              </div>
            </div>

            <div className="checkout-meta">
              <div>
                <span>Paying to</span>
                <strong>{data.upiId}</strong>
              </div>
              <div>
                <span>Payer</span>
                <strong>{data.payerName || "Guest"}</strong>
              </div>
            </div>

            <div className="qr-shell">
              <QRCodeCanvas
                value={upiString}
                size={170}
                bgColor="#fffdf8"
                fgColor="#15130f"
                level="M"
                includeMargin
              />
              <span>Scan with any UPI app</span>
            </div>

            <label className="proof-uploader">
              <span>Upload payment screenshot</span>
              <input type="file" accept="image/*" onChange={handleFileChange} />
              <small>{screenshot ? screenshot.name : "PNG, JPG or screenshot image"}</small>
            </label>

            <button
              onClick={handleSubmitPayment}
              disabled={uploading}
              className="checkout-submit"
            >
              {uploading ? "Uploading proof..." : "Mark as Paid"}
            </button>
          </>
        )}
      </section>
    </div>
  );
}