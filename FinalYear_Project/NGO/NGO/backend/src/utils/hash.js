const crypto = require("crypto");

function stableStringify(value) {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }
  const keys = Object.keys(value).sort();
  const body = keys
    .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
    .join(",");
  return `{${body}}`;
}

function sha256(payload) {
  return crypto.createHash("sha256").update(stableStringify(payload)).digest("hex");
}

function makeTxRef(hash) {
  return `KL-LEDGER-${hash.slice(0, 16).toUpperCase()}`;
}

function donationPayload(row) {
  return {
    type: "donation",
    id: row.id,
    donor_id: row.donor_id,
    campaign_id: row.campaign_id,
    amount: Number(row.amount),
    currency: row.currency,
    receipt_no: row.receipt_no,
    created_at: toIso(row.created_at),
  };
}

function expensePayload(row) {
  return {
    type: "expense",
    id: row.id,
    campaign_id: row.campaign_id,
    amount: Number(row.amount),
    category: row.category,
    vendor: row.vendor,
    spent_on: toDateOnly(row.spent_on),
  };
}

function toIso(value) {
  if (!value) return null;
  if (typeof value === "string") return value;
  return value.toISOString();
}

function toDateOnly(value) {
  if (!value) return null;
  if (typeof value === "string") return value.slice(0, 10);
  return value.toISOString().slice(0, 10);
}

module.exports = {
  sha256,
  makeTxRef,
  donationPayload,
  expensePayload,
};
