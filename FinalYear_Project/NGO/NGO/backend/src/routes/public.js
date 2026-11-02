const express = require("express");
const { query } = require("../config/db");
const { verifyRecord } = require("../utils/ledger");
const { subscribe } = require("../utils/realtime");

const router = express.Router();

router.get("/events", (req, res) => {
  subscribe(req, res);
});

router.get("/utilization", async (req, res, next) => {
  try {
    const expenses = await query(
      `SELECT e.*, c.title AS campaign_title, c.slug, l.record_hash, l.tx_ref
       FROM expenses e
       JOIN campaigns c ON c.id = e.campaign_id
       LEFT JOIN ledger_records l ON l.record_type = 'expense' AND l.record_id = e.id
       WHERE e.published = 1
       ORDER BY e.published_at DESC, e.spent_on DESC`
    );
    res.json({ expenses });
  } catch (error) {
    next(error);
  }
});

router.get("/ledger", async (req, res, next) => {
  try {
    const records = await query(
      `SELECT l.*,
        CASE
          WHEN l.record_type = 'donation' THEN d.receipt_no
          ELSE e.title
        END AS label,
        CASE
          WHEN l.record_type = 'donation' THEN d.amount
          ELSE e.amount
        END AS amount
       FROM ledger_records l
       LEFT JOIN donations d ON l.record_type = 'donation' AND d.id = l.record_id
       LEFT JOIN expenses e ON l.record_type = 'expense' AND e.id = l.record_id
       WHERE (l.record_type = 'donation' AND d.published = 1 AND d.status = 'completed')
          OR (l.record_type = 'expense' AND e.published = 1)
       ORDER BY l.verified_at DESC`
    );
    res.json({ records });
  } catch (error) {
    next(error);
  }
});

router.get("/verify/:type/:id", async (req, res, next) => {
  try {
    const result = await verifyRecord(req.params.type, req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get("/home", async (req, res, next) => {
  try {
    const [stats] = await query(
      `SELECT
        (SELECT COALESCE(SUM(amount),0) FROM donations WHERE status='completed') AS total_donations,
        (SELECT COUNT(*) FROM campaigns) AS campaigns,
        (SELECT COUNT(*) FROM beneficiaries WHERE status='approved') AS beneficiaries,
        (SELECT COALESCE(SUM(amount),0) FROM expenses WHERE published = 1) AS expenses,
        (SELECT COUNT(*) FROM users WHERE role='donor') AS donors`
    );
    const campaigns = await query(
      "SELECT * FROM campaigns WHERE status = 'active' ORDER BY raised_amount DESC LIMIT 3"
    );
    const testimonials = await query("SELECT * FROM testimonials");
    const reviews = await query(
      `SELECT r.rating, r.comment, u.name AS author
       FROM reviews r JOIN users u ON u.id = r.donor_id
       ORDER BY r.created_at DESC LIMIT 6`
    );
    const causes = await query(
      "SELECT cause, COUNT(*) AS count, COALESCE(SUM(raised_amount),0) AS raised FROM campaigns GROUP BY cause"
    );
    res.json({ stats, campaigns, testimonials, causes, reviews });
  } catch (error) {
    next(error);
  }
});

router.get("/impact", async (req, res, next) => {
  try {
    const byCause = await query(
      `SELECT cause, COALESCE(SUM(raised_amount),0) AS raised, COALESCE(SUM(target_amount),0) AS target
       FROM campaigns GROUP BY cause`
    );
    const monthly = await query(
      `SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COALESCE(SUM(amount),0) AS total
       FROM donations WHERE status='completed'
       GROUP BY DATE_FORMAT(created_at, '%Y-%m')
       ORDER BY month`
    );
    const utilization = await query(
      `SELECT category, COALESCE(SUM(amount),0) AS total
       FROM expenses WHERE published = 1 GROUP BY category`
    );
    const [totals] = await query(
      `SELECT
        (SELECT COALESCE(SUM(amount),0) FROM donations WHERE status='completed') AS donated,
        (SELECT COALESCE(SUM(amount),0) FROM expenses WHERE published = 1) AS utilized,
        (SELECT COUNT(*) FROM ledger_records l
          LEFT JOIN donations d ON l.record_type='donation' AND d.id=l.record_id
          LEFT JOIN expenses e ON l.record_type='expense' AND e.id=l.record_id
          WHERE (l.record_type='donation' AND d.published=1) OR (l.record_type='expense' AND e.published=1)
        ) AS sealed_records`
    );
    res.json({ byCause, monthly, utilization, totals });
  } catch (error) {
    next(error);
  }
});

router.post("/contact", async (req, res, next) => {
  try {
    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ message: "Name, email and message are required." });
    }
    await query("INSERT INTO contact_messages (name, email, message) VALUES (?, ?, ?)", [
      name,
      email,
      message,
    ]);
    res.status(201).json({ message: "Message received. Our team will reply within two working days." });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
