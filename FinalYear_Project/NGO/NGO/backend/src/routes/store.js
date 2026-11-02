const express = require("express");
const { body, validationResult } = require("express-validator");
const { query } = require("../config/db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const items = await query("SELECT * FROM store_items ORDER BY status ASC, name ASC");
    res.json({ items });
  } catch (error) {
    next(error);
  }
});

router.post(
  "/pledge",
  requireAuth,
  body("item_id").isInt(),
  body("quantity").isInt({ min: 1 }),
  body("pickup_city").trim().isLength({ min: 2 }),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ message: "Please complete the pledge form." });
      }
      const items = await query("SELECT * FROM store_items WHERE id = ?", [req.body.item_id]);
      if (!items.length || items[0].status !== "open") {
        return res.status(400).json({ message: "This item is not accepting pledges." });
      }
      await query(
        `INSERT INTO in_kind_donations (donor_id, item_id, quantity, pickup_city, status)
         VALUES (?, ?, ?, ?, 'pledged')`,
        [req.user.id, req.body.item_id, req.body.quantity, req.body.pickup_city]
      );
      await query("UPDATE store_items SET pledged_qty = pledged_qty + ? WHERE id = ?", [
        req.body.quantity,
        req.body.item_id,
      ]);
      await query(
        "UPDATE store_items SET status = 'fulfilled' WHERE id = ? AND pledged_qty >= needed_qty",
        [req.body.item_id]
      );
      const updated = await query("SELECT * FROM store_items WHERE id = ?", [req.body.item_id]);
      res.status(201).json({ item: updated[0], message: "Pledge recorded. A volunteer will coordinate pickup." });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
