CREATE DATABASE IF NOT EXISTS toygo_desktop CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE toygo_desktop;

CREATE TABLE IF NOT EXISTS tenants (
  id CHAR(36) PRIMARY KEY,
  legal_name VARCHAR(180) NOT NULL,
  trade_name VARCHAR(120) NOT NULL,
  document_number VARCHAR(32),
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
);

CREATE TABLE IF NOT EXISTS operational_units (
  id CHAR(36) PRIMARY KEY,
  tenant_id CHAR(36) NOT NULL,
  name VARCHAR(120) NOT NULL,
  capacity_limit INT NOT NULL DEFAULT 0,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  CONSTRAINT fk_operational_units_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY,
  tenant_id CHAR(36) NOT NULL,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(180) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('owner','manager','cashier','monitor','maintenance') NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_users_email (email),
  CONSTRAINT fk_users_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE TABLE IF NOT EXISTS guardians (
  id CHAR(36) PRIMARY KEY,
  tenant_id CHAR(36) NOT NULL,
  full_name VARCHAR(160) NOT NULL,
  document_number VARCHAR(32),
  phone VARCHAR(32),
  email VARCHAR(180),
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  KEY ix_guardians_lookup (tenant_id, full_name, document_number),
  CONSTRAINT fk_guardians_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE TABLE IF NOT EXISTS children (
  id CHAR(36) PRIMARY KEY,
  tenant_id CHAR(36) NOT NULL,
  guardian_id CHAR(36) NOT NULL,
  full_name VARCHAR(160) NOT NULL,
  birth_date DATE,
  notes VARCHAR(500),
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  KEY ix_children_guardian (tenant_id, guardian_id, full_name),
  CONSTRAINT fk_children_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_children_guardian FOREIGN KEY (guardian_id) REFERENCES guardians(id)
);

CREATE TABLE IF NOT EXISTS items (
  id CHAR(36) PRIMARY KEY,
  tenant_id CHAR(36) NOT NULL,
  sku VARCHAR(64) NOT NULL,
  description VARCHAR(180) NOT NULL,
  base_unit VARCHAR(24) NOT NULL,
  item_type ENUM('snack','drink','toy_accessory','maintenance_part','cleaning','package_component') NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_items_sku (tenant_id, sku),
  CONSTRAINT fk_items_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE TABLE IF NOT EXISTS unit_conversions (
  id CHAR(36) PRIMARY KEY,
  item_id CHAR(36) NOT NULL,
  from_unit VARCHAR(24) NOT NULL,
  to_base_unit VARCHAR(24) NOT NULL,
  factor_to_base DECIMAL(18,6) NOT NULL,
  UNIQUE KEY uq_unit_conversions (item_id, from_unit),
  CONSTRAINT fk_unit_conversions_item FOREIGN KEY (item_id) REFERENCES items(id),
  CONSTRAINT chk_unit_factor_positive CHECK (factor_to_base > 0)
);

CREATE TABLE IF NOT EXISTS play_assets (
  id CHAR(36) PRIMARY KEY,
  tenant_id CHAR(36) NOT NULL,
  operational_unit_id CHAR(36) NOT NULL,
  code VARCHAR(64) NOT NULL,
  name VARCHAR(140) NOT NULL,
  asset_type ENUM('stay','cart','toy') NOT NULL,
  included_minutes INT NOT NULL,
  base_price_cents BIGINT NOT NULL,
  extra_minute_cents BIGINT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_play_assets_code (tenant_id, operational_unit_id, code),
  CONSTRAINT fk_play_assets_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_play_assets_unit FOREIGN KEY (operational_unit_id) REFERENCES operational_units(id),
  CONSTRAINT chk_play_asset_minutes CHECK (included_minutes > 0),
  CONSTRAINT chk_play_asset_base_price CHECK (base_price_cents >= 0),
  CONSTRAINT chk_play_asset_extra_price CHECK (extra_minute_cents >= 0)
);

CREATE TABLE IF NOT EXISTS play_sessions (
  id CHAR(40) PRIMARY KEY,
  tenant_id CHAR(36) NOT NULL,
  operational_unit_id CHAR(36) NOT NULL,
  guardian_id CHAR(36) NOT NULL,
  child_id CHAR(36) NOT NULL,
  primary_asset_id CHAR(36) NOT NULL,
  status ENUM('active','closed','cancelled') NOT NULL DEFAULT 'active',
  started_at DATETIME(6) NOT NULL,
  planned_minutes INT NOT NULL,
  base_price_cents BIGINT NOT NULL,
  extra_minute_cents BIGINT NOT NULL,
  alert_threshold_minutes INT NOT NULL DEFAULT 5,
  closed_at DATETIME(6),
  created_by_user_id CHAR(36) NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  KEY ix_play_sessions_active (tenant_id, operational_unit_id, status, started_at),
  CONSTRAINT fk_play_sessions_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_play_sessions_unit FOREIGN KEY (operational_unit_id) REFERENCES operational_units(id),
  CONSTRAINT fk_play_sessions_guardian FOREIGN KEY (guardian_id) REFERENCES guardians(id),
  CONSTRAINT fk_play_sessions_child FOREIGN KEY (child_id) REFERENCES children(id),
  CONSTRAINT fk_play_sessions_asset FOREIGN KEY (primary_asset_id) REFERENCES play_assets(id),
  CONSTRAINT fk_play_sessions_user FOREIGN KEY (created_by_user_id) REFERENCES users(id),
  CONSTRAINT chk_play_sessions_minutes CHECK (planned_minutes > 0)
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id CHAR(40) PRIMARY KEY,
  tenant_id CHAR(36) NOT NULL,
  operational_unit_id CHAR(36) NOT NULL,
  item_id CHAR(36) NOT NULL,
  direction ENUM('in','out','neutral') NOT NULL,
  source VARCHAR(40) NOT NULL,
  source_id VARCHAR(80) NOT NULL,
  quantity_base_units DECIMAL(18,6) NOT NULL,
  base_unit VARCHAR(24) NOT NULL,
  unit_value_base_cents DECIMAL(18,4) NOT NULL,
  total_value_cents BIGINT NOT NULL,
  occurred_at DATETIME(6) NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_user_id CHAR(36) NOT NULL,
  reversal_of_movement_id CHAR(40),
  metadata_json JSON,
  KEY ix_stock_movements_item_time (tenant_id, operational_unit_id, item_id, occurred_at),
  CONSTRAINT fk_stock_movements_item FOREIGN KEY (item_id) REFERENCES items(id),
  CONSTRAINT fk_stock_movements_unit FOREIGN KEY (operational_unit_id) REFERENCES operational_units(id),
  CONSTRAINT fk_stock_movements_user FOREIGN KEY (created_by_user_id) REFERENCES users(id),
  CONSTRAINT chk_stock_quantity_positive CHECK (quantity_base_units >= 0),
  CONSTRAINT chk_stock_total_positive CHECK (total_value_cents >= 0)
);

CREATE TABLE IF NOT EXISTS stock_balances (
  tenant_id CHAR(36) NOT NULL,
  operational_unit_id CHAR(36) NOT NULL,
  item_id CHAR(36) NOT NULL,
  quantity_base_units DECIMAL(18,6) NOT NULL,
  average_unit_value_base_cents DECIMAL(18,4) NOT NULL,
  base_unit VARCHAR(24) NOT NULL,
  updated_at DATETIME(6) NOT NULL,
  PRIMARY KEY (tenant_id, operational_unit_id, item_id),
  CONSTRAINT fk_stock_balances_item FOREIGN KEY (item_id) REFERENCES items(id),
  CONSTRAINT fk_stock_balances_unit FOREIGN KEY (operational_unit_id) REFERENCES operational_units(id)
);

CREATE TABLE IF NOT EXISTS finance_ledger_entries (
  id CHAR(40) PRIMARY KEY,
  tenant_id CHAR(36) NOT NULL,
  operational_unit_id CHAR(36) NOT NULL,
  direction ENUM('debit','credit') NOT NULL,
  source VARCHAR(40) NOT NULL,
  source_id VARCHAR(80) NOT NULL,
  amount_cents BIGINT NOT NULL,
  payment_method ENUM('cash','pix','card','boleto','internal'),
  occurred_at DATETIME(6) NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  created_by_user_id CHAR(36) NOT NULL,
  reversal_of_entry_id CHAR(40),
  metadata_json JSON,
  KEY ix_finance_entries_time (tenant_id, operational_unit_id, occurred_at),
  CONSTRAINT fk_finance_entries_unit FOREIGN KEY (operational_unit_id) REFERENCES operational_units(id),
  CONSTRAINT fk_finance_entries_user FOREIGN KEY (created_by_user_id) REFERENCES users(id),
  CONSTRAINT chk_finance_amount_positive CHECK (amount_cents >= 0)
);

CREATE TABLE IF NOT EXISTS play_session_lines (
  id CHAR(40) PRIMARY KEY,
  tenant_id CHAR(36) NOT NULL,
  play_session_id CHAR(40) NOT NULL,
  line_type ENUM('time','asset','product') NOT NULL,
  item_id CHAR(36),
  asset_id CHAR(36),
  description VARCHAR(180) NOT NULL,
  quantity DECIMAL(18,6) NOT NULL,
  unit_price_cents BIGINT NOT NULL,
  total_cents BIGINT NOT NULL,
  stock_movement_id CHAR(40),
  finance_entry_id CHAR(40),
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  KEY ix_play_session_lines_session (play_session_id, created_at),
  CONSTRAINT fk_play_session_lines_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_play_session_lines_session FOREIGN KEY (play_session_id) REFERENCES play_sessions(id),
  CONSTRAINT fk_play_session_lines_item FOREIGN KEY (item_id) REFERENCES items(id),
  CONSTRAINT fk_play_session_lines_asset FOREIGN KEY (asset_id) REFERENCES play_assets(id),
  CONSTRAINT fk_play_session_lines_stock FOREIGN KEY (stock_movement_id) REFERENCES stock_movements(id),
  CONSTRAINT fk_play_session_lines_finance FOREIGN KEY (finance_entry_id) REFERENCES finance_ledger_entries(id),
  CONSTRAINT chk_play_session_lines_quantity CHECK (quantity > 0),
  CONSTRAINT chk_play_session_lines_unit_price CHECK (unit_price_cents >= 0),
  CONSTRAINT chk_play_session_lines_total CHECK (total_cents >= 0)
);

CREATE TABLE IF NOT EXISTS license_cache (
  machine_id VARCHAR(64) PRIMARY KEY,
  license_key VARCHAR(120),
  status ENUM('inactive','active','grace','blocked','expired') NOT NULL,
  activated_at DATETIME(6),
  expires_at DATETIME(6),
  last_successful_check_at DATETIME(6),
  blocked_reason VARCHAR(255),
  payment_json JSON,
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6)
);

CREATE TABLE IF NOT EXISTS backup_runs (
  id CHAR(40) PRIMARY KEY,
  reason ENUM('manual','scheduled','before_update') NOT NULL,
  file_path VARCHAR(500) NOT NULL,
  checksum_sha256 CHAR(64),
  size_bytes BIGINT,
  created_by_user_id CHAR(36) NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  CONSTRAINT fk_backup_runs_user FOREIGN KEY (created_by_user_id) REFERENCES users(id)
);

DROP TRIGGER IF EXISTS trg_stock_movements_no_update;
DROP TRIGGER IF EXISTS trg_stock_movements_no_delete;
DROP TRIGGER IF EXISTS trg_finance_entries_no_update;
DROP TRIGGER IF EXISTS trg_finance_entries_no_delete;

CREATE TRIGGER trg_stock_movements_no_update BEFORE UPDATE ON stock_movements
FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'stock_movements e um ledger imutavel';

CREATE TRIGGER trg_stock_movements_no_delete BEFORE DELETE ON stock_movements
FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'stock_movements e um ledger imutavel';

CREATE TRIGGER trg_finance_entries_no_update BEFORE UPDATE ON finance_ledger_entries
FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'finance_ledger_entries e um ledger imutavel';

CREATE TRIGGER trg_finance_entries_no_delete BEFORE DELETE ON finance_ledger_entries
FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'finance_ledger_entries e um ledger imutavel';
