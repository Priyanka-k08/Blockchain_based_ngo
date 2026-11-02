const { extraCampaigns } = require("../data/extraCampaigns");
const { query, pool } = require("../config/db");

async function columnExists(table, column) {
  const rows = await query(
    `SELECT COUNT(*) AS c FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    [table, column]
  );
  return Number(rows[0].c) > 0;
}

async function tableExists(table) {
  const rows = await query(
    `SELECT COUNT(*) AS c FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
    [table]
  );
  return Number(rows[0].c) > 0;
}

async function addColumn(table, column, definition) {
  if (!(await columnExists(table, column))) {
    await query(`ALTER TABLE \`${table}\` ADD COLUMN ${column} ${definition}`);
    return true;
  }
  return false;
}

async function migrate() {
  await addColumn("donations", "whatsapp_phone", "VARCHAR(20) NULL");
  await addColumn("donations", "gateway", "VARCHAR(40) NOT NULL DEFAULT 'razorpay'");
  await addColumn("donations", "gateway_order_id", "VARCHAR(80) NULL");
  await addColumn("donations", "gateway_payment_id", "VARCHAR(80) NULL");
  const addedDonationPublished = await addColumn(
    "donations",
    "published",
    "TINYINT(1) NOT NULL DEFAULT 0"
  );
  await addColumn("expenses", "video_url", "VARCHAR(500) NULL");
  await addColumn("expenses", "impact_message", "TEXT NULL");
  const addedExpensePublished = await addColumn(
    "expenses",
    "published",
    "TINYINT(1) NOT NULL DEFAULT 0"
  );
  await addColumn("expenses", "published_at", "TIMESTAMP NULL");

  if (!(await tableExists("reviews"))) {
    await query(`
      CREATE TABLE reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        donation_id INT NOT NULL UNIQUE,
        donor_id INT NOT NULL,
        campaign_id INT NOT NULL,
        rating TINYINT NOT NULL,
        comment TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (donation_id) REFERENCES donations(id),
        FOREIGN KEY (donor_id) REFERENCES users(id),
        FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
      )
    `);
  }

  if (!(await tableExists("notifications"))) {
    await query(`
      CREATE TABLE notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        channel ENUM('whatsapp','in_app') NOT NULL DEFAULT 'whatsapp',
        recipient_phone VARCHAR(20),
        kind VARCHAR(40) NOT NULL,
        body TEXT NOT NULL,
        video_url VARCHAR(500),
        status ENUM('demo','sent','failed') NOT NULL DEFAULT 'demo',
        provider_id VARCHAR(180),
        meta_json JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);
  }

  if (addedDonationPublished) {
    await query("UPDATE donations SET published = 1 WHERE status = 'completed'");
  }
  if (addedExpensePublished) {
    await query(
      "UPDATE expenses SET published = 1, published_at = COALESCE(published_at, created_at)"
    );
  }

  for (const row of extraCampaigns) {
    const existing = await query("SELECT id FROM campaigns WHERE slug = ?", [row[0]]);
    if (!existing.length) {
      await query(
        `INSERT INTO campaigns
          (slug, title, cause, summary, story, location, image_url, target_amount, raised_amount, status, start_date, end_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        row
      );
    }
  }
}

async function runStandalone() {
  await migrate();
  await pool.end();
  console.log("KindLedger schema migrated.");
}

if (require.main === module) {
  runStandalone().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

module.exports = { migrate };
