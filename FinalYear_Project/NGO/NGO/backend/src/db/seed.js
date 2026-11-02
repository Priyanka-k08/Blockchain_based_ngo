const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env"), override: true });
const bcrypt = require("bcryptjs");
const mysql = require("mysql2/promise");
const { sha256, makeTxRef, donationPayload, expensePayload } = require("../utils/hash");

async function waitForMysql(config, attempts = 20) {
  let lastError;
  for (let i = 0; i < attempts; i += 1) {
    try {
      const connection = await mysql.createConnection(config);
      await connection.query("SELECT 1");
      return connection;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
  throw lastError;
}

async function seed() {
  const baseConfig = {
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "kindledger",
    password: process.env.DB_PASSWORD ?? "kindledger",
    multipleStatements: true,
    dateStrings: true,
  };

  const adminConnection = await waitForMysql(baseConfig);
  await adminConnection.query(
    `CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || "kindledger"}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await adminConnection.end();

  const db = await mysql.createConnection({
    ...baseConfig,
    database: process.env.DB_NAME || "kindledger",
  });

  const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  await db.query(schema);

  const [usersCount] = await db.query("SELECT COUNT(*) AS count FROM users");
  if (usersCount[0].count > 0) {
    console.log("Database already seeded.");
    await db.end();
    return;
  }

  const adminHash = await bcrypt.hash("Admin@123", 10);
  const donorHash = await bcrypt.hash("Donor@123", 10);

  const [userResult] = await db.query(
    `INSERT INTO users (name, email, password_hash, role, phone, city) VALUES
      ('Meera Iyer', 'admin@kindledger.org', ?, 'admin', '+91 98765 11001', 'Pune'),
      ('Arjun Desai', 'donor@kindledger.org', ?, 'donor', '+91 98765 11002', 'Mumbai'),
      ('Leela Fernandes', 'leela@kindledger.org', ?, 'donor', '+91 98765 11003', 'Goa')`,
    [adminHash, donorHash, donorHash]
  );

  const campaigns = [
    [
      "warm-nights-kit",
      "Warm Nights Kit",
      "Shelter",
      "Blankets, tarpaulin sheets and solar lanterns for families living in informal settlements before monsoon nights turn colder.",
      "KindLedger field teams mapped 420 households along the Mutha riverbank that lose heat faster than brick homes. Each kit includes two blankets, a weather sheet, a lantern and a hygiene pack. Utilization receipts are sealed into the public ledger after every vendor payout.",
      "Pune, Maharashtra",
      "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1200&q=80",
      450000,
      186400,
      "active",
      "2026-07-01",
      "2026-12-31",
    ],
    [
      "midday-meals-circle",
      "Midday Meals Circle",
      "Nutrition",
      "A community kitchen that prepares 600 balanced lunches each weekday for school-going children in peri-urban wards.",
      "Local cooks, not a distant contractor, run this kitchen. Grain, oil and vegetables are purchased weekly. Donors can follow every grain sack purchase on the utilization page, hashed after the NGO books the expense.",
      "Hadapsar, Pune",
      "https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=1200&q=80",
      320000,
      248900,
      "active",
      "2026-04-12",
      "2026-11-30",
    ],
    [
      "clinic-on-wheels",
      "Clinic on Wheels",
      "Healthcare",
      "A refurbished van that takes primary care, glucose tests and maternal check-ups to three villages every Saturday.",
      "The van already completed 18 camps. Funds cover fuel, a nurse stipend, rapid test kits and maintenance. Each camp expense is logged with vendor name and a SHA-256 seal.",
      "Mulshi Taluka",
      "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?auto=format&fit=crop&w=1200&q=80",
      780000,
      412050,
      "active",
      "2026-01-15",
      "2026-12-20",
    ],
    [
      "after-school-studio",
      "After-School Studio",
      "Education",
      "Evening learning studio with books, lamps and two tutors for first-generation schoolgoers.",
      "The studio runs in a rented community hall. Target covers rent for 8 months, tutor honoraria and a small library. Item donations such as unused textbooks can be pledged in the in-kind store.",
      "Kothrud, Pune",
      "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=80",
      210000,
      97400,
      "active",
      "2026-06-01",
      "2027-01-31",
    ],
    [
      "rainwater-commons",
      "Rainwater Commons",
      "Water",
      "Repair of two community wells and a rooftop harvesting system for a drought-prone hamlet.",
      "Engineering drawings are complete. Funds buy tanks, filters and mason wages. Because water works are high-value, every invoice is hashed into the KindLedger seal before it appears on the public audit page.",
      "Baramati rural",
      "https://images.unsplash.com/photo-1541919329513-35f7af297c80?auto=format&fit=crop&w=1200&q=80",
      560000,
      151200,
      "active",
      "2026-05-20",
      "2027-03-01",
    ],
    [
      "senior-day-circle",
      "Senior Day Circle",
      "Elder care",
      "Daytime companionship, hot meals and blood-pressure monitoring for elders living alone.",
      "A modest rented hall hosts 35 regulars. Utilization covers cook wages, groceries and a visiting physician twice a month.",
      "Camp area, Pune",
      "https://images.unsplash.com/photo-1581579438747-1dc8d64bb43b?auto=format&fit=crop&w=1200&q=80",
      180000,
      180000,
      "completed",
      "2025-11-01",
      "2026-08-30",
    ],
  ];

  await db.query(
    `INSERT INTO campaigns
      (slug, title, cause, summary, story, location, image_url, target_amount, raised_amount, status, start_date, end_date)
     VALUES ?`,
    [campaigns]
  );

  const [campaignRows] = await db.query("SELECT id, slug FROM campaigns");
  const campaignId = Object.fromEntries(campaignRows.map((row) => [row.slug, row.id]));

  const donations = [
    [2, campaignId["warm-nights-kit"], 5000, "INR", "UPI", "KL-2026-1001", "For extra blankets", "completed", "2026-08-12 10:14:00"],
    [2, campaignId["midday-meals-circle"], 2500, "INR", "Card", "KL-2026-1002", "Week of lunches", "completed", "2026-08-19 16:40:00"],
    [3, campaignId["clinic-on-wheels"], 10000, "INR", "NetBanking", "KL-2026-1003", null, "completed", "2026-09-02 09:05:00"],
    [3, campaignId["after-school-studio"], 1500, "INR", "UPI", "KL-2026-1004", "Books", "completed", "2026-09-14 12:22:00"],
    [2, campaignId["rainwater-commons"], 8000, "INR", "UPI", "KL-2026-1005", null, "completed", "2026-09-21 18:01:00"],
    [3, campaignId["warm-nights-kit"], 3000, "INR", "Card", "KL-2026-1006", null, "completed", "2026-09-28 11:47:00"],
  ];

  await db.query(
    `INSERT INTO donations
      (donor_id, campaign_id, amount, currency, method, receipt_no, note, status, created_at)
     VALUES ?`,
    [donations]
  );

  const storeItems = [
    ["School notebooks (set of 10)", "Education", "Ruled notebooks for the after-school studio.", "https://images.unsplash.com/photo-1456513080800-7d3e8e31c3d2?auto=format&fit=crop&w=900&q=80", "set", 80, 22, "open"],
    ["Unused warm blankets", "Shelter", "Clean double blankets for winter kits.", "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=900&q=80", "piece", 120, 41, "open"],
    ["Dry ration packs", "Nutrition", "Rice, dal and oil packs of 5 kg each.", "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=900&q=80", "pack", 200, 90, "open"],
    ["First-aid kits", "Healthcare", "Basic kits for the mobile clinic camps.", "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=900&q=80", "kit", 40, 11, "open"],
    ["Children’s storybooks", "Education", "English or Marathi picture books in good condition.", "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=900&q=80", "book", 150, 64, "open"],
    ["Adult cotton clothing", "Shelter", "Gently used shirts, sarees and trousers.", "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=900&q=80", "set", 90, 90, "fulfilled"],
  ];

  await db.query(
    `INSERT INTO store_items (name, category, description, image_url, unit, needed_qty, pledged_qty, status) VALUES ?`,
    [storeItems]
  );

  await db.query(
    `INSERT INTO in_kind_donations (donor_id, item_id, quantity, pickup_city, status) VALUES
      (2, 1, 5, 'Mumbai', 'received'),
      (3, 3, 10, 'Goa', 'pledged')`
  );

  const beneficiaries = [
    ["Ananya K.", "Student", "Kothrud", "First-generation learner who attends the evening studio after helping at her mother’s stall.", "Lamps, notebooks and a bicycle", "approved", "https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=900&q=80"],
    ["Ramesh Patil", "Elder", "Camp", "Lives alone after his children moved for work. Joins the Senior Day Circle twice a week.", "Hot meals and BP monitoring", "approved", "https://images.unsplash.com/photo-1566616213894-2d4e1baee5d8?auto=format&fit=crop&w=900&q=80"],
    ["Savita Women’s Collective", "Community group", "Hadapsar", "Twelve women who cook for the midday meals kitchen and train two apprentices.", "Kitchen utensils and oil drums", "approved", "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=80"],
    ["Mulshi PHC outreach", "Health camp", "Mulshi", "Village health workers who host the Saturday van and keep follow-up registers.", "Glucose strips and BP cuffs", "approved", "https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=900&q=80"],
  ];

  await db.query(
    `INSERT INTO beneficiaries (name, category, location, story, need_summary, status, image_url) VALUES ?`,
    [beneficiaries]
  );

  const expenses = [
    [campaignId["warm-nights-kit"], "Blanket bulk purchase", "Supplies", "Pune Wool Co-op", 64000, "2026-08-20", "200 blankets @ wholesale", 1],
    [campaignId["midday-meals-circle"], "Weekly groceries", "Nutrition", "Hadapsar Mandi", 18750, "2026-09-05", "Rice, vegetables, oil", 1],
    [campaignId["clinic-on-wheels"], "Rapid test kits", "Healthcare", "MediSupply Pune", 22100, "2026-09-11", "Glucose and malaria kits", 1],
    [campaignId["after-school-studio"], "Tutor honoraria", "Education", "Studio tutors", 16000, "2026-09-30", "Two tutors, September", 1],
    [campaignId["rainwater-commons"], "Mason advance", "Infrastructure", "Baramati Works", 45000, "2026-09-18", "Well lining labour", 1],
    [campaignId["senior-day-circle"], "Cook wages", "Operations", "Day Circle kitchen", 12000, "2026-08-01", "Closed campaign payout", 1],
  ];

  await db.query(
    `INSERT INTO expenses (campaign_id, title, category, vendor, amount, spent_on, notes, created_by) VALUES ?`,
    [expenses]
  );

  await db.query(
    `INSERT INTO testimonials (author, role, quote) VALUES
      ('Arjun Desai', 'Monthly donor', 'I could finally see the exact kitchen invoice my lunch donations paid for. That is the only reason I increased my gift.'),
      ('Dr. Nalini Rao', 'Volunteer physician', 'The van schedule is public, the kit purchases are hashed, and the villages know when we arrive. It feels like a clinic, not a photo-op.'),
      ('Savita Kulkarni', 'Community cook', 'We are not hidden behind a logo. Our names sit on the utilization page next to the oil drums we actually used.')`
  );

  const [donationRows] = await db.query("SELECT * FROM donations");
  const [expenseRows] = await db.query("SELECT * FROM expenses");

  for (const row of donationRows) {
    const payload = donationPayload(row);
    const hash = sha256(payload);
    await db.query(
      `INSERT INTO ledger_records (record_type, record_id, payload_json, record_hash, tx_ref)
       VALUES ('donation', ?, ?, ?, ?)`,
      [row.id, JSON.stringify(payload), hash, makeTxRef(hash)]
    );
  }

  for (const row of expenseRows) {
    const payload = expensePayload(row);
    const hash = sha256(payload);
    await db.query(
      `INSERT INTO ledger_records (record_type, record_id, payload_json, record_hash, tx_ref)
       VALUES ('expense', ?, ?, ?, ?)`,
      [row.id, JSON.stringify(payload), hash, makeTxRef(hash)]
    );
  }

  await db.end();
  console.log("KindLedger database seeded.");
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
