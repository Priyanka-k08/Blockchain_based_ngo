const express = require("express");
const { body, validationResult } = require("express-validator");
const { query, pool } = require("../config/db");
const { requireAuth } = require("../middleware/auth");
const { sealDonation } = require("../utils/ledger");
const { createOrder, verifySignature } = require("../utils/razorpay");
const { sendWhatsApp, donationConfirmText, normalizePhone } = require("../utils/whatsapp");

const router = express.Router();

function receiptNo() {
  const n = Date.now().toString(36).toUpperCase();
  const r = Math.floor(10 + Math.random() * 89);
  return `KL-${new Date().getFullYear()}-${n}${r}`;
}

function validate(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ message: errors.array()[0].msg });
    return false;
  }
  return true;
}

router.post(
  "/checkout",
  requireAuth,
  body("campaign_id").isInt().withMessage("Campaign is required."),
  body("amount").isFloat({ gt: 99 }).withMessage("Minimum gift is ₹100."),
  body("method").isIn(["UPI", "Card", "NetBanking"]).withMessage("Choose a payment method."),
  async (req, res, next) => {
    try {
      if (!validate(req, res)) return;
      const { campaign_id, amount, method, note, whatsapp_phone } = req.body;
      const campaigns = await query("SELECT * FROM campaigns WHERE id = ?", [campaign_id]);
      if (!campaigns.length || campaigns[0].status === "paused") {
        return res.status(400).json({ message: "This campaign is not accepting donations." });
      }
      const phone = normalizePhone(whatsapp_phone || req.user.phone);
      if (!phone) {
        return res.status(400).json({ message: "A WhatsApp mobile number is required for confirmation." });
      }
      const receipt = receiptNo();
      const { order, demo, keyId } = await createOrder(amount, receipt);
      const result = await query(
        `INSERT INTO donations
          (donor_id, campaign_id, amount, currency, method, receipt_no, note, status, whatsapp_phone, gateway, gateway_order_id, published)
         VALUES (?, ?, ?, 'INR', ?, ?, ?, 'pending', ?, 'razorpay', ?, 0)`,
        [req.user.id, campaign_id, amount, method, receipt, note || null, phone, order.id]
      );
      if (whatsapp_phone || !req.user.phone) {
        await query("UPDATE users SET phone = ? WHERE id = ?", [phone, req.user.id]);
      }
      res.status(201).json({
        donation_id: result.insertId,
        receipt_no: receipt,
        demo,
        razorpay: {
          key: keyId,
          order_id: order.id,
          amount: order.amount,
          currency: order.currency || "INR",
          name: "KindLedger Trust",
          description: campaigns[0].title,
          prefill: {
            name: req.user.name,
            email: req.user.email,
            contact: phone,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/verify",
  requireAuth,
  body("donation_id").isInt(),
  body("razorpay_order_id").notEmpty(),
  body("razorpay_payment_id").notEmpty(),
  body("razorpay_signature").notEmpty(),
  async (req, res, next) => {
    try {
      if (!validate(req, res)) return;
      const { donation_id, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
      const rows = await query("SELECT * FROM donations WHERE id = ?", [donation_id]);
      if (!rows.length || rows[0].donor_id !== req.user.id) {
        return res.status(404).json({ message: "Donation order not found." });
      }
      const donation = rows[0];
      if (donation.gateway_order_id !== razorpay_order_id) {
        return res.status(400).json({ message: "Order mismatch." });
      }
      if (
        !verifySignature({
          orderId: razorpay_order_id,
          paymentId: razorpay_payment_id,
          signature: razorpay_signature,
        })
      ) {
        return res.status(400).json({ message: "Payment signature could not be verified." });
      }
      if (donation.status === "completed") {
        const [campaign] = await query("SELECT * FROM campaigns WHERE id = ?", [donation.campaign_id]);
        return res.json({ donation, campaign, already_completed: true });
      }

      const conn = await pool.getConnection();
      try {
        await conn.beginTransaction();
        await conn.execute(
          `UPDATE donations SET status = 'completed', gateway_payment_id = ? WHERE id = ? AND status = 'pending'`,
          [razorpay_payment_id, donation.id]
        );
        await conn.execute("UPDATE campaigns SET raised_amount = raised_amount + ? WHERE id = ?", [
          donation.amount,
          donation.campaign_id,
        ]);
        await conn.commit();
      } catch (error) {
        await conn.rollback();
        throw error;
      } finally {
        conn.release();
      }

      const fresh = await query("SELECT * FROM donations WHERE id = ?", [donation.id]);
      const sealed = await sealDonation(fresh[0]);
      const [campaign] = await query("SELECT * FROM campaigns WHERE id = ?", [donation.campaign_id]);
      const whatsapp = await sendWhatsApp({
        userId: req.user.id,
        phone: donation.whatsapp_phone || req.user.phone,
        kind: "donation_confirm",
        body: donationConfirmText({
          name: req.user.name,
          amount: donation.amount,
          campaign: campaign.title,
          receipt: donation.receipt_no,
          paymentId: razorpay_payment_id,
        }),
        meta: { donation_id: donation.id },
      });

      res.json({
        donation: { ...fresh[0], record_hash: sealed.hash, tx_ref: sealed.txRef },
        campaign,
        ledger: { hash: sealed.hash, tx_ref: sealed.txRef },
        whatsapp,
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get("/mine", requireAuth, async (req, res, next) => {
  try {
    const donations = await query(
      `SELECT d.*, c.title, c.slug, l.record_hash, l.tx_ref,
              (SELECT COUNT(*) FROM reviews r WHERE r.donation_id = d.id) AS reviewed
       FROM donations d
       JOIN campaigns c ON c.id = d.campaign_id
       LEFT JOIN ledger_records l ON l.record_type = 'donation' AND l.record_id = d.id
       WHERE d.donor_id = ?
       ORDER BY d.created_at DESC`,
      [req.user.id]
    );
    res.json({ donations });
  } catch (error) {
    next(error);
  }
});

router.get("/receipt/:receiptNo", requireAuth, async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT d.*, c.title, c.location, u.name AS donor_name, u.email, l.record_hash, l.tx_ref,
              (SELECT COUNT(*) FROM reviews r WHERE r.donation_id = d.id) AS reviewed
       FROM donations d
       JOIN campaigns c ON c.id = d.campaign_id
       JOIN users u ON u.id = d.donor_id
       LEFT JOIN ledger_records l ON l.record_type = 'donation' AND l.record_id = d.id
       WHERE d.receipt_no = ?`,
      [req.params.receiptNo]
    );
    if (!rows.length) {
      return res.status(404).json({ message: "Receipt not found." });
    }
    if (req.user.role !== "admin" && rows[0].donor_id !== req.user.id) {
      return res.status(403).json({ message: "You cannot view this receipt." });
    }
    res.json({ receipt: rows[0] });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
