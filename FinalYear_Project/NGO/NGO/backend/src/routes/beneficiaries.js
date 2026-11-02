const express = require("express");
const { query } = require("../config/db");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const people = await query(
      "SELECT * FROM beneficiaries WHERE status = 'approved' ORDER BY name"
    );
    res.json({ beneficiaries: people });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
