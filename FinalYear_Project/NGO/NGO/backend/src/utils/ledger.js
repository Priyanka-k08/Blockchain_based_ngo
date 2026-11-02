const { query } = require("../config/db");
const { sha256, makeTxRef, donationPayload, expensePayload } = require("./hash");
const { publishRecord } = require("./chainAdapter");

async function sealDonation(row) {
  const payload = donationPayload(row);
  const hash = sha256(payload);
  const txRef = makeTxRef(hash);
  await query(
    `INSERT INTO ledger_records (record_type, record_id, payload_json, record_hash, tx_ref)
     VALUES ('donation', ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE payload_json = VALUES(payload_json), record_hash = VALUES(record_hash), tx_ref = VALUES(tx_ref)`,
    [row.id, JSON.stringify(payload), hash, txRef]
  );
  await publishRecord({ type: "donation", recordId: row.id, hash, payload, txRef });
  return { hash, txRef, payload };
}

async function sealExpense(row) {
  const payload = expensePayload(row);
  const hash = sha256(payload);
  const txRef = makeTxRef(hash);
  await query(
    `INSERT INTO ledger_records (record_type, record_id, payload_json, record_hash, tx_ref)
     VALUES ('expense', ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE payload_json = VALUES(payload_json), record_hash = VALUES(record_hash), tx_ref = VALUES(tx_ref)`,
    [row.id, JSON.stringify(payload), hash, txRef]
  );
  await publishRecord({ type: "expense", recordId: row.id, hash, payload, txRef });
  return { hash, txRef, payload };
}

async function verifyRecord(type, id) {
  const tables = {
    donation: { sql: "SELECT * FROM donations WHERE id = ?", payload: donationPayload },
    expense: { sql: "SELECT * FROM expenses WHERE id = ?", payload: expensePayload },
  };
  const spec = tables[type];
  if (!spec) {
    const error = new Error("Unsupported record type.");
    error.status = 400;
    throw error;
  }
  const rows = await query(spec.sql, [id]);
  if (!rows.length) {
    const error = new Error("Record not found.");
    error.status = 404;
    throw error;
  }
  const payload = spec.payload(rows[0]);
  const recomputed = sha256(payload);
  const ledger = await query(
    "SELECT * FROM ledger_records WHERE record_type = ? AND record_id = ?",
    [type, id]
  );
  const stored = ledger[0] || null;
  return {
    type,
    id: Number(id),
    payload,
    stored_hash: stored?.record_hash || null,
    recomputed_hash: recomputed,
    tx_ref: stored?.tx_ref || null,
    matches: Boolean(stored) && stored.record_hash === recomputed,
    sealed_at: stored?.verified_at || null,
    chain_ready: true,
    network: process.env.CHAIN_NETWORK || "local-sha256",
  };
}

module.exports = { sealDonation, sealExpense, verifyRecord };
