const express = require("express");
const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");
const { query } = require("../config/db");
const { signToken, requireAuth } = require("../middleware/auth");

const router = express.Router();

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array()[0].msg });
  }
  next();
}

router.post(
  "/register",
  body("name").trim().isLength({ min: 2 }).withMessage("Name is required."),
  body("email").isEmail().withMessage("Valid email is required."),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters."),
  body("phone").optional({ checkFalsy: true }).isString(),
  body("city").optional({ checkFalsy: true }).isString(),
  validate,
  async (req, res, next) => {
    try {
      const { name, email, password, phone, city } = req.body;
      const existing = await query("SELECT id FROM users WHERE email = ?", [email.toLowerCase()]);
      if (existing.length) {
        return res.status(409).json({ message: "An account with this email already exists." });
      }
      const passwordHash = await bcrypt.hash(password, 10);
      const result = await query(
        "INSERT INTO users (name, email, password_hash, role, phone, city) VALUES (?, ?, ?, 'donor', ?, ?)",
        [name, email.toLowerCase(), passwordHash, phone || null, city || null]
      );
      const user = {
        id: result.insertId,
        name,
        email: email.toLowerCase(),
        role: "donor",
        phone: phone || null,
        city: city || null,
      };
      res.status(201).json({ token: signToken(user), user });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  "/login",
  body("email").isEmail().withMessage("Valid email is required."),
  body("password").notEmpty().withMessage("Password is required."),
  validate,
  async (req, res, next) => {
    try {
      const users = await query("SELECT * FROM users WHERE email = ?", [req.body.email.toLowerCase()]);
      if (!users.length) {
        return res.status(401).json({ message: "Invalid email or password." });
      }
      const user = users[0];
      const ok = await bcrypt.compare(req.body.password, user.password_hash);
      if (!ok) {
        return res.status(401).json({ message: "Invalid email or password." });
      }
      const publicUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        city: user.city,
      };
      res.json({ token: signToken(publicUser), user: publicUser });
    } catch (error) {
      next(error);
    }
  }
);

router.get("/me", requireAuth, async (req, res) => {
  res.json({ user: req.user });
});

router.put(
  "/me",
  requireAuth,
  body("name").optional().trim().isLength({ min: 2 }),
  body("phone").optional({ checkFalsy: true }).isString(),
  body("city").optional({ checkFalsy: true }).isString(),
  validate,
  async (req, res, next) => {
    try {
      const name = req.body.name || req.user.name;
      const phone = req.body.phone ?? req.user.phone;
      const city = req.body.city ?? req.user.city;
      await query("UPDATE users SET name = ?, phone = ?, city = ? WHERE id = ?", [
        name,
        phone,
        city,
        req.user.id,
      ]);
      res.json({ user: { ...req.user, name, phone, city } });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
