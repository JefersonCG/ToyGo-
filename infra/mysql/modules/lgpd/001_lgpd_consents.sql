USE toygo_desktop;

CREATE TABLE IF NOT EXISTS lgpd_consents (
  id CHAR(36) PRIMARY KEY,
  tenant_id CHAR(36) NOT NULL,
  guardian_name VARCHAR(160) NOT NULL,
  guardian_document VARCHAR(32),
  child_name VARCHAR(160) NOT NULL,
  consent_type ENUM('waiver','marketing','membership','booking') NOT NULL,
  signed_payload_hash CHAR(64) NOT NULL,
  signed_at DATETIME(6) NOT NULL,
  revoked_at DATETIME(6),
  metadata_json JSON,
  KEY ix_lgpd_consents_tenant_time (tenant_id, signed_at),
  CONSTRAINT fk_lgpd_consents_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);