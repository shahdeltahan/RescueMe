const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const requestRoutes = require("./routes/requests");
const paymentRoutes = require("./routes/payment");
const reportsRoutes = require("./routes/reports");
const casesRoutes = require("./routes/cases");
const volunteerRoutes = require("./routes/volunteers");
const adoptionRoutes = require("./routes/adoption");
const notificationRoutes = require("./routes/notifications");
const veterinaryRoutes = require("./routes/veterinary");

const app = express();

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ limit: '5mb', extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/reports", reportsRoutes);
app.use("/api/cases", casesRoutes);
app.use("/api/volunteers", volunteerRoutes);
app.use("/api/adoption", adoptionRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/veterinary", veterinaryRoutes);

app.get("/", (req, res) => {
  res.send("RescueMe backend is running");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

