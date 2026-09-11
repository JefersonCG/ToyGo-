CREATE TABLE IF NOT EXISTS rental_assets (
  id CHAR(36) PRIMARY KEY,
  tenant_id CHAR(36) NOT NULL,
  operational_unit_id CHAR(36) NOT NULL,
  category ENUM('electric_cart','ride_on_toy','locker','wristband','playground_resource','jump_park_resource') NOT NULL,
  code VARCHAR(64) NOT NULL,
  display_name VARCHAR(140) NOT NULL,
  status ENUM('available','reserved','in_use','inspection_due','maintenance','retired') NOT NULL DEFAULT 'available',
  battery_percent INT,
  last_inspection_at DATETIME(6),
  metadata_json JSON,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_rental_assets_unit_code (tenant_id, operational_unit_id, code),
  KEY ix_rental_assets_status (tenant_id, operational_unit_id, status),
  CONSTRAINT fk_rental_assets_unit FOREIGN KEY (operational_unit_id) REFERENCES operational_units(id),
  CONSTRAINT chk_rental_assets_battery CHECK (battery_percent IS NULL OR (battery_percent >= 0 AND battery_percent <= 100))
);

CREATE TABLE IF NOT EXISTS visit_sessions (
  id CHAR(36) PRIMARY KEY,
  tenant_id CHAR(36) NOT NULL,
  operational_unit_id CHAR(36) NOT NULL,
  vertical ENUM('cart_rental','indoor_playground','shopping_kiosk','party_event','jump_park') NOT NULL,
  guardian_id CHAR(36) NOT NULL,
  status ENUM('queued','checked_in','active','return_pending','closed','cancelled') NOT NULL,
  starts_at DATETIME(6) NOT NULL,
  expected_ends_at DATETIME(6),
  closed_at DATETIME(6),
  package_id CHAR(36),
  waiver_id CHAR(36),
  metadata_json JSON,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  KEY ix_visit_sessions_status (tenant_id, operational_unit_id, status),
  KEY ix_visit_sessions_time (tenant_id, operational_unit_id, starts_at),
  CONSTRAINT fk_visit_sessions_unit FOREIGN KEY (operational_unit_id) REFERENCES operational_units(id)
);

CREATE TABLE IF NOT EXISTS rental_sessions (
  id CHAR(36) PRIMARY KEY,
  visit_session_id CHAR(36) NOT NULL,
  asset_id CHAR(36) NOT NULL,
  status ENUM('assigned','in_use','returned','closed_with_damage','closed','cancelled') NOT NULL,
  checked_out_at DATETIME(6) NOT NULL,
  expected_return_at DATETIME(6),
  returned_at DATETIME(6),
  price_cents BIGINT NOT NULL DEFAULT 0,
  overtime_cents BIGINT NOT NULL DEFAULT 0,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  KEY ix_rental_sessions_asset_status (asset_id, status),
  CONSTRAINT fk_rental_sessions_visit FOREIGN KEY (visit_session_id) REFERENCES visit_sessions(id),
  CONSTRAINT fk_rental_sessions_asset FOREIGN KEY (asset_id) REFERENCES rental_assets(id),
  CONSTRAINT chk_rental_session_price CHECK (price_cents >= 0 AND overtime_cents >= 0)
);

CREATE TABLE IF NOT EXISTS return_inspections (
  id CHAR(36) PRIMARY KEY,
  rental_session_id CHAR(36) NOT NULL,
  inspected_at DATETIME(6) NOT NULL,
  inspected_by_user_id CHAR(36) NOT NULL,
  outcome ENUM('ok','dirty','damaged','lost','maintenance_required') NOT NULL,
  notes VARCHAR(500),
  charge_cents BIGINT NOT NULL DEFAULT 0,
  maintenance_ticket_id CHAR(36),
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  CONSTRAINT fk_return_inspections_rental FOREIGN KEY (rental_session_id) REFERENCES rental_sessions(id),
  CONSTRAINT fk_return_inspections_user FOREIGN KEY (inspected_by_user_id) REFERENCES users(id),
  CONSTRAINT chk_return_inspections_charge CHECK (charge_cents >= 0)
);

CREATE TABLE IF NOT EXISTS cross_sell_offers (
  id CHAR(36) PRIMARY KEY,
  tenant_id CHAR(36) NOT NULL,
  operational_unit_id CHAR(36),
  trigger_code ENUM('check_in','active_session','return','checkout','party_booking','repeat_visit') NOT NULL,
  kind ENUM('snack','drink','anti_slip_socks','extra_time','photo','locker','party_addon','membership','voucher','retail_item') NOT NULL,
  title VARCHAR(140) NOT NULL,
  description VARCHAR(300),
  price_cents BIGINT,
  item_id CHAR(36),
  package_id CHAR(36),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  metadata_json JSON,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  KEY ix_cross_sell_offers_trigger (tenant_id, operational_unit_id, trigger_code, active),
  CONSTRAINT fk_cross_sell_offers_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  CONSTRAINT fk_cross_sell_offers_unit FOREIGN KEY (operational_unit_id) REFERENCES operational_units(id),
  CONSTRAINT chk_cross_sell_offers_price CHECK (price_cents IS NULL OR price_cents >= 0)
);

