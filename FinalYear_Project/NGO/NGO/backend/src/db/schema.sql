CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('donor', 'admin') NOT NULL DEFAULT 'donor',
  phone VARCHAR(30),
  city VARCHAR(80),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS campaigns (
  id INT AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(160) NOT NULL UNIQUE,
  title VARCHAR(180) NOT NULL,
  cause VARCHAR(80) NOT NULL,
  summary TEXT NOT NULL,
  story TEXT NOT NULL,
  location VARCHAR(120) NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  target_amount DECIMAL(12,2) NOT NULL,
  raised_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  status ENUM('active', 'completed', 'paused') NOT NULL DEFAULT 'active',
  start_date DATE NOT NULL,
  end_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS donations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  donor_id INT NOT NULL,
  campaign_id INT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  currency VARCHAR(8) NOT NULL DEFAULT 'INR',
  method VARCHAR(40) NOT NULL,
  receipt_no VARCHAR(40) NOT NULL UNIQUE,
  note VARCHAR(255),
  status ENUM('completed', 'pending') NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (donor_id) REFERENCES users(id),
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
);

CREATE TABLE IF NOT EXISTS store_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  category VARCHAR(80) NOT NULL,
  description TEXT NOT NULL,
  image_url VARCHAR(500) NOT NULL,
  unit VARCHAR(40) NOT NULL,
  needed_qty INT NOT NULL,
  pledged_qty INT NOT NULL DEFAULT 0,
  status ENUM('open', 'fulfilled') NOT NULL DEFAULT 'open'
);

CREATE TABLE IF NOT EXISTS in_kind_donations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  donor_id INT NOT NULL,
  item_id INT NOT NULL,
  quantity INT NOT NULL,
  pickup_city VARCHAR(80) NOT NULL,
  status ENUM('pledged', 'received') NOT NULL DEFAULT 'pledged',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (donor_id) REFERENCES users(id),
  FOREIGN KEY (item_id) REFERENCES store_items(id)
);

CREATE TABLE IF NOT EXISTS beneficiaries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  category VARCHAR(80) NOT NULL,
  location VARCHAR(120) NOT NULL,
  story TEXT NOT NULL,
  need_summary VARCHAR(255) NOT NULL,
  status ENUM('approved', 'pending') NOT NULL DEFAULT 'approved',
  image_url VARCHAR(500) NOT NULL
);

CREATE TABLE IF NOT EXISTS expenses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  campaign_id INT NOT NULL,
  title VARCHAR(180) NOT NULL,
  category VARCHAR(80) NOT NULL,
  vendor VARCHAR(160) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  spent_on DATE NOT NULL,
  notes TEXT,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS ledger_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  record_type ENUM('donation', 'expense') NOT NULL,
  record_id INT NOT NULL,
  payload_json JSON NOT NULL,
  record_hash CHAR(64) NOT NULL,
  tx_ref VARCHAR(64) NOT NULL,
  verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_ledger (record_type, record_id)
);

CREATE TABLE IF NOT EXISTS testimonials (
  id INT AUTO_INCREMENT PRIMARY KEY,
  author VARCHAR(120) NOT NULL,
  role VARCHAR(120) NOT NULL,
  quote TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
