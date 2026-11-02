const express = require("express");
const { query } = require("../config/db");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const { cause, q, status } = req.query;
    let sql = "SELECT * FROM campaigns WHERE 1=1";
    const params = [];
    if (cause) {
      sql += " AND cause = ?";
      params.push(cause);
    }
    if (status) {
      sql += " AND status = ?";
      params.push(status);
    }
    if (q) {
      sql += " AND (title LIKE ? OR summary LIKE ? OR location LIKE ?)";
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }
    sql += " ORDER BY status ASC, created_at DESC";
    const campaigns = await query(sql, params);
    res.json({ campaigns });
  } catch (error) {
    next(error);
  }
});

router.get("/causes", async (req, res, next) => {
  try {
    const rows = await query(
      "SELECT cause, COUNT(*) AS count FROM campaigns GROUP BY cause ORDER BY cause"
    );
    res.json({ causes: rows });
  } catch (error) {
    next(error);
  }
});

router.get("/:slug", async (req, res, next) => {
  try {
    const campaigns = await query("SELECT * FROM campaigns WHERE slug = ?", [req.params.slug]);
    if (!campaigns.length) {
      return res.status(404).json({ message: "Campaign not found." });
    }
    const campaign = campaigns[0];
    const expenses = await query(
      `SELECT e.*, l.record_hash, l.tx_ref
       FROM expenses e
       LEFT JOIN ledger_records l ON l.record_type = 'expense' AND l.record_id = e.id
       WHERE e.campaign_id = ? AND e.published = 1
       ORDER BY e.spent_on DESC`,
      [campaign.id]
    );
    const donors = await query(
      `SELECT COUNT(*) AS donor_count, COALESCE(SUM(amount),0) AS total
       FROM donations WHERE campaign_id = ? AND status = 'completed'`,
      [campaign.id]
    );
    const reviews = await query(
      `SELECT r.rating, r.comment, r.created_at, u.name AS author
       FROM reviews r JOIN users u ON u.id = r.donor_id
       WHERE r.campaign_id = ? ORDER BY r.created_at DESC LIMIT 8`,
      [campaign.id]
    );
    const [reviewStats] = await query(
      "SELECT ROUND(AVG(rating),1) AS average, COUNT(*) AS count FROM reviews WHERE campaign_id = ?",
      [campaign.id]
    );
    res.json({ campaign, expenses, stats: donors[0], reviews, reviewStats });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
