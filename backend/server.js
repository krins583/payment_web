const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");

const app = express();
app.use(cors());
app.use(express.json());

const serviceAccount = process.env.FIREBASE_CREDENTIALS 
  ? JSON.parse(process.env.FIREBASE_CREDENTIALS) 
  : require("./firebase-key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

app.get("/api/test", (req, res) => {
  res.json({ message: "Backend perfectly kaam kar raha hai!" });
});

// 1. CREATE LINK API
app.post("/api/create-link", async (req, res) => {
  try {
    const { upiId, basePrice, payerName, payerNumber, penaltyAmount, penaltyTime } = req.body;

    if (!upiId || !basePrice) return res.status(400).json({ error: "UPI ID aur Base Price zaroori hai!" });

    const paymentData = {
      upiId,
      basePrice: Number(basePrice),
      payerName: payerName || "Guest",
      payerNumber: payerNumber || "",
      penaltyAmount: Number(penaltyAmount) || 10,
      penaltyTime: Number(penaltyTime) || 10,
      createdAt: Date.now(),
      status: "pending"
    };

    const docRef = await db.collection("paymentLinks").add(paymentData);
    res.status(200).json({ success: true, linkId: docRef.id });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// 2. GET PAYMENT INFO API (Payer ke liye)
app.get("/api/payment-info/:linkId", async (req, res) => {
  try {
    const { linkId } = req.params;
    const docRef = db.collection("paymentLinks").doc(linkId);
    const docSnap = await docRef.get();

    if (!docSnap.exists) return res.status(404).json({ error: "Link invalid hai" });
    res.status(200).json({ success: true, data: docSnap.data() });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

// 3. MARK AS PAID API (Payer upload karega screenshot)
app.post("/api/mark-paid", async (req, res) => {
  try {
    // ADDED: utrNumber ko body se receive karna
    const { linkId, screenshotUrl, finalAmount, utrNumber } = req.body;
    
    await db.collection("paymentLinks").doc(linkId).update({
      status: "paid",
      screenshotUrl: screenshotUrl,
      paidAmount: finalAmount, 
      utrNumber: utrNumber || null, // ADDED: Database mein UTR save karna
      paidAt: Date.now()
    });

    res.status(200).json({ success: true, message: "Payment verified!" });
  } catch (error) {
    res.status(500).json({ error: "Update fail" });
  }
});

// 4. GET ALL HISTORY API (Admin Dashboard ke liye)
app.get("/api/history", async (req, res) => {
  try {
    const snapshot = await db.collection("paymentLinks").orderBy("createdAt", "desc").get();
    const historyData = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.status(200).json({ success: true, data: historyData });
  } catch (error) {
    res.status(500).json({ error: "History fetch fail" });
  }
});

// 5. DELETE LINK API (Nayi API - Delete Button ke liye)
app.delete("/api/delete-link/:id", async (req, res) => {
  try {
    const linkId = req.params.id;
    await db.collection("paymentLinks").doc(linkId).delete();
    res.status(200).json({ success: true, message: "Link deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log("🔥 Firebase Connected successfully!");
});