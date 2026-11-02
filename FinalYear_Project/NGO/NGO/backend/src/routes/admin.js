const express = require("express");
const { body, validationResult } = require("express-validator");
const { query } = require("../config/db");
const { requireAuth, requireRole } = require("../middleware/auth");
const { sealExpense } = require("../utils/ledger");
const { broadcast } = require("../utils/realtime");
const { sendWhatsApp, utilizationText } = require("../utils/whatsapp");

const router = express.Router();
router.use(requireAuth, requireRole("admin"));

router.get("/overview", async (req, res, next) => {
  try {
    const [row] = await query(
      `SELECT
        (SELECT COUNT(*) FROM users) AS users,
        (SELECT COUNT(*) FROM campaigns) AS campaigns,
        (SELECT COUNT(*) FROM donations) AS donations,
        (SELECT COALESCE(SUM(amount),0) FROM donations WHERE status='completed') AS donation_total,
        (SELECT COUNT(*) FROM beneficiaries) AS beneficiaries,
        (SELECT COUNT(*) FROM store_items) AS store_items,
        (SELECT COALESCE(SUM(amount),0) FROM expenses WHERE published = 1) AS expense_total,
        (SELECT COUNT(*) FROM contact_messages) AS messages`
    );
    const recentDonations = await query(
      `SELECT d.id, d.amount, d.receipt_no, d.created_at, u.name AS donor, c.title AS campaign
       FROM donations d
       JOIN users u ON u.id = d.donor_id
       JOIN campaigns c ON c.id = d.campaign_id
       ORDER BY d.created_at DESC LIMIT 6`
    );
    res.json({ overview: row, recentDonations });
  } catch (error) {
    next(error);
  }
});

router.get("/users", async (req, res, next) => {
  try {
    const users = await query(
      "SELECT id, name, email, role, phone, city, created_at FROM users ORDER BY created_at DESC"
    );
    res.json({ users });
  } catch (error) {
    next(error);
  }
});

router.patch("/users/:id/role", async (req, res, next) => {
  try {
    if (!["admin", "donor"].includes(req.body.role)) {
      return res.status(400).json({ message: "Role must be admin or donor." });
    }
    await query("UPDATE users SET role = ? WHERE id = ?", [req.body.role, req.params.id]);
    res.json({ message: "Role updated." });
  } catch (error) {
    next(error);
  }
});

router.get("/campaigns", async (req, res, next) => {
  try {
    const campaigns = await query("SELECT * FROM campaigns ORDER BY created_at DESC");
    res.json({ campaigns });
  } catch (error) {
    next(error);
  }
});

router.post("/campaigns", async (req, res, next) => {
  try {
    const {
      slug, title, cause, summary, story, location, image_url,
      target_amount, start_date, end_date, status,
    } = req.body;
    if (!slug || !title || !cause || !summary || !story || !location || !image_url || !target_amount || !start_date) {
      return res.status(400).json({ message: "Please fill all required campaign fields." });
    }
    const result = await query(
      `INSERT INTO campaigns
        (slug, title, cause, summary, story, location, image_url, target_amount, status, start_date, end_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [slug, title, cause, summary, story, location, image_url, target_amount, status || "active", start_date, end_date || null]
    );
    const rows = await query("SELECT * FROM campaigns WHERE id = ?", [result.insertId]);
    res.status(201).json({ campaign: rows[0] });
  } catch (error) {
    next(error);
  }
});

router.put("/campaigns/:id", async (req, res, next) => {
  try {
    const fields = [
      "title", "cause", "summary", "story", "location", "image_url",
      "target_amount", "status", "start_date", "end_date",
    ];
    const sets = [];
    const params = [];
    fields.forEach((field) => {
      if (req.body[field] !== undefined) {
        sets.push(`${field} = ?`);
        params.push(req.body[field]);
      }
    });
    if (!sets.length) return res.status(400).json({ message: "No updates provided." });
    params.push(req.params.id);
    await query(`UPDATE campaigns SET ${sets.join(", ")} WHERE id = ?`, params);
    const rows = await query("SELECT * FROM campaigns WHERE id = ?", [req.params.id]);
    res.json({ campaign: rows[0] });
  } catch (error) {
    next(error);
  }
});

router.get("/donations", async (req, res, next) => {
  try {
    const donations = await query(
      `SELECT d.*, u.name AS donor, c.title AS campaign, l.record_hash, l.tx_ref
       FROM donations d
       JOIN users u ON u.id = d.donor_id
       JOIN campaigns c ON c.id = d.campaign_id
       LEFT JOIN ledger_records l ON l.record_type = 'donation' AND l.record_id = d.id
       ORDER BY d.created_at DESC`
    );
    res.json({ donations });
  } catch (error) {
    next(error);
  }
});

router.get("/beneficiaries", async (req, res, next) => {
  try {
    const beneficiaries = await query("SELECT * FROM beneficiaries ORDER BY id DESC");
    res.json({ beneficiaries });
  } catch (error) {
    next(error);
  }
});

router.post("/beneficiaries", async (req, res, next) => {
  try {
    const { name, category, location, story, need_summary, image_url, status } = req.body;
    if (!name || !category || !location || !story || !need_summary || !image_url) {
      return res.status(400).json({ message: "All beneficiary fields are required." });
    }
    const result = await query(
      `INSERT INTO beneficiaries (name, category, location, story, need_summary, status, image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, category, location, story, need_summary, status || "approved", image_url]
    );
    const rows = await query("SELECT * FROM beneficiaries WHERE id = ?", [result.insertId]);
    res.status(201).json({ beneficiary: rows[0] });
  } catch (error) {
    next(error);
  }
});

router.patch("/beneficiaries/:id", async (req, res, next) => {
  try {
    await query("UPDATE beneficiaries SET status = ? WHERE id = ?", [
      req.body.status,
      req.params.id,
    ]);
    res.json({ message: "Beneficiary updated." });
  } catch (error) {
    next(error);
  }
});

router.get("/store", async (req, res, next) => {
  try {
    const items = await query("SELECT * FROM store_items ORDER BY id DESC");
    const pledges = await query(
      `SELECT p.*, u.name AS donor, s.name AS item_name
       FROM in_kind_donations p
       JOIN users u ON u.id = p.donor_id
       JOIN store_items s ON s.id = p.item_id
       ORDER BY p.created_at DESC`
    );
    res.json({ items, pledges });
  } catch (error) {
    next(error);
  }
});

router.post("/store", async (req, res, next) => {
  try {
    const { name, category, description, image_url, unit, needed_qty } = req.body;
    if (!name || !category || !description || !image_url || !unit || !needed_qty) {
      return res.status(400).json({ message: "All store fields are required." });
    }
    const result = await query(
      `INSERT INTO store_items (name, category, description, image_url, unit, needed_qty)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, category, description, image_url, unit, needed_qty]
    );
    const rows = await query("SELECT * FROM store_items WHERE id = ?", [result.insertId]);
    res.status(201).json({ item: rows[0] });
  } catch (error) {
    next(error);
  }
});

router.patch("/pledges/:id", async (req, res, next) => {
  try {
    await query("UPDATE in_kind_donations SET status = ? WHERE id = ?", [
      req.body.status,
      req.params.id,
    ]);
    res.json({ message: "Pledge updated." });
  } catch (error) {
    next(error);
  }
});

router.get("/expenses", async (req, res, next) => {
  try {
    const expenses = await query(
      `SELECT e.*, c.title AS campaign_title, l.record_hash, l.tx_ref
       FROM expenses e
       JOIN campaigns c ON c.id = e.campaign_id
       LEFT JOIN ledger_records l ON l.record_type = 'expense' AND l.record_id = e.id
       ORDER BY e.spent_on DESC`
    );
    res.json({ expenses });
  } catch (error) {
    next(error);
  }
});

router.post(
  "/expenses",
  body("campaign_id").isInt(),
  body("title").trim().notEmpty(),
  body("category").trim().notEmpty(),
  body("vendor").trim().notEmpty(),
  body("amount").isFloat({ gt: 0 }),
  body("spent_on").notEmpty(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: "Please complete the expense form." });
      }
      const { campaign_id, title, category, vendor, amount, spent_on, notes, video_url, impact_message } = req.body;
      const result = await query(
        `INSERT INTO expenses (campaign_id, title, category, vendor, amount, spent_on, notes, created_by, video_url, impact_message, published)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
        [
          campaign_id,
          title,
          category,
          vendor,
          amount,
          spent_on,
          notes || null,
          req.user.id,
          video_url || null,
          impact_message || null,
        ]
      );
      const rows = await query("SELECT * FROM expenses WHERE id = ?", [result.insertId]);
      const sealed = await sealExpense(rows[0]);
      res.status(201).json({
        expense: rows[0],
        ledger: { hash: sealed.hash, tx_ref: sealed.txRef },
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get("/messages", async (req, res, next) => {
  try {
    const messages = await query("SELECT * FROM contact_messages ORDER BY created_at DESC");
    res.json({ messages });
  } catch (error) {
    next(error);
  }
});

router.patch("/donations/:id/publish", async (req, res, next) => {
  try {
    const rows = await query("SELECT * FROM donations WHERE id = ?", [req.params.id]);
    if (!rows.length || rows[0].status !== "completed") {
      return res.status(400).json({ message: "Only completed gifts can be published." });
    }
    await query("UPDATE donations SET published = 1 WHERE id = ?", [req.params.id]);
    broadcast({ type: "ledger", record_type: "donation", record_id: Number(req.params.id) });
    res.json({ message: "Donation is now on the public ledger." });
  } catch (error) {
    next(error);
  }
});

router.patch("/expenses/:id/publish", async (req, res, next) => {
  try {
    const videoUrl =
      req.body.video_url ||
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4";
    const impact =
      req.body.impact_message ||
      "A short field video shows how this amount was used.";
    await query(
      `UPDATE expenses SET published = 1, published_at = NOW(), video_url = ?, impact_message = ? WHERE id = ?`,
      [videoUrl, impact, req.params.id]
    );
    const [expense] = await query(
      `SELECT e.*, c.title AS campaign_title FROM expenses e
       JOIN campaigns c ON c.id = e.campaign_id WHERE e.id = ?`,
      [req.params.id]
    );
    if (!expense) {
      return res.status(404).json({ message: "Expense not found." });
    }
    const donors = await query(
      `SELECT d.id, d.whatsapp_phone, u.id AS user_id, u.name, u.phone
       FROM donations d
       JOIN users u ON u.id = d.donor_id
       WHERE d.campaign_id = ? AND d.status = 'completed'`,
      [expense.campaign_id]
    );
    const notices = [];
    for (const donor of donors) {
      const notice = await sendWhatsApp({
        userId: donor.user_id,
        phone: donor.whatsapp_phone || donor.phone,
        kind: "utilization_video",
        videoUrl,
        body: utilizationText({
          name: donor.name,
          campaign: expense.campaign_title,
          title: expense.title,
          amount: expense.amount,
          videoUrl,
          impact,
        }),
        meta: { expense_id: expense.id, donation_id: donor.id },
      });
      notices.push(notice);
    }
    broadcast({ type: "utilization", record_id: expense.id, campaign_id: expense.campaign_id });
    res.json({
      message: "Expense published. Donors received a utilization WhatsApp (or a demo log if API keys are not set).",
      notified: notices.length,
    });
  } catch (error) {
    next(error);
  }
});

router.get("/notifications", async (req, res, next) => {
  try {
    const notifications = await query(
      "SELECT * FROM notifications ORDER BY created_at DESC LIMIT 80"
    );
    res.json({ notifications });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
