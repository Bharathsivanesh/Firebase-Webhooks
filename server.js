const express = require("express");
const admin = require("firebase-admin");
const cors = require("cors");
const serviceAccount = JSON.parse(process.env.SERVICE_ACCOUNT_KEY);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const app = express();
app.use(cors());
app.use(express.json());

app.post("/send-to-all", async (req, res) => {
  try {
    const { title, body } = req.body;

    const snapshot = await admin.firestore().collection("deviceTokens").get();

    if (snapshot.empty) {
      return res.status(404).json({ message: "No tokens found" });
    }

    const tokens = snapshot.docs.map((doc) => doc.data().token);
    const response = await admin.messaging().sendEachForMulticast({
      notification: { title, body },
      tokens,
    });

    res.json({
      sent: response.successCount,
      failed: response.failureCount,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({ error: error.message });
  }
});

app.get("/", (req, res) => {
  res.send("FCM Notification Server Running 🚀");
});

app.listen(5000, () => console.log("Server running on port 5000"));
