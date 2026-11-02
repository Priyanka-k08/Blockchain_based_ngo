const express = require("express");
const { body, validationResult } = require("express-validator");
const { query } = require("../config/db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const { campaign_id } = req.query;
    let sql = `SELECT r.rating, r.comment, r.created_at, u.name AS author, c.title AS campaign
               FROM reviews r
               JOIN users u ON u.id = r.donor_id
               JOIN campaigns c ON c.id = r.campaign_id`;
    const params = [];
    if (campaign_id) {
      sql += " WHERE r.campaign_id = ?";
      params.push(campaign_id);
    }
    sql += " ORDER BY r.created_at DESC LIMIT 40";
    const reviews = await query(sql, params);
    const [avg] = campaign_id
      ? await query(
          "SELECT ROUND(AVG(rating),1) AS average, COUNT(*) AS count FROM reviews WHERE campaign_id = ?",
          [campaign_id]
        )
      : await query("SELECT ROUND(AVG(rating),1) AS average, COUNT(*) AS count FROM reviews");
    res.json({ reviews, summary: avg });
  } catch (error) {
    next(error);
  }
});

router.post(
  "/",
  requireAuth,
  body("donation_id").isInt(),
  body("rating").isInt({ min: 1, max: 5 }),
  body("comment").optional({ checkFalsy: true }).isLength({ max: 600 }),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: "Please choose a rating from 1 to 5." });
      }
      const donations = await query("SELECT * FROM donations WHERE id = ? AND donor_id = ?", [
        req.body.donation_id,
        req.user.id,
      ]);
      if (!donations.length || donations[0].status !== "completed") {
        return res.status(400).json({ message: "You can review only after a successful payment." });
      }
      const existing = await query("SELECT id FROM reviews WHERE donation_id = ?", [req.body.donation_id]);
      if (existing.length) {
        return res.status(409).json({ message: "This gift already has a review." });
      }
      const result = await query(
        "INSERT INTO reviews (donation_id, donor_id, campaign_id, rating, comment) VALUES (?, ?, ?, ?, ?)",
        [
          req.body.donation_id,
          req.user.id,
          donations[0].campaign_id,
          req.body.rating,
          req.body.comment || null,
        ]
      );
      const rows = await query("SELECT * FROM reviews WHERE id = ?", [result.insertId]);
      res.status(201).json({ review: rows[0] });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
