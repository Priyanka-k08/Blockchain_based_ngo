require("dotenv").config({ override: true });
const express = require("express");
const cors = require("cors");
const { notFound, errorHandler } = require("./middleware/error");
const { migrate } = require("./db/migrate");

const authRoutes = require("./routes/auth");
const campaignRoutes = require("./routes/campaigns");
const donationRoutes = require("./routes/donations");
const storeRoutes = require("./routes/store");
const beneficiaryRoutes = require("./routes/beneficiaries");
const publicRoutes = require("./routes/public");
const adminRoutes = require("./routes/admin");
const reviewRoutes = require("./routes/reviews");

const app = express();
app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ ok: true, name: "KindLedger API" });
});

app.use("/api/auth", authRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/donations", donationRoutes);
app.use("/api/store", storeRoutes);
app.use("/api/beneficiaries", beneficiaryRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api", publicRoutes);
app.use("/api/admin", adminRoutes);

app.use(notFound);
app.use(errorHandler);

const port = Number(process.env.PORT || 5000);

migrate()
  .then(() => {
    app.listen(port, () => {
      console.log(`KindLedger API running on http://localhost:${port}`);
    });
  })
  .catch((error) => {
    console.error("Migration failed", error);
    process.exit(1);
  });
