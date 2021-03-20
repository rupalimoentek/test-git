-- new columns for billing summary information
ALTER TABLE org_billing ADD COLUMN account_name VARCHAR(64) DEFAULT NULL;
ALTER TABLE org_billing ADD COLUMN billing_date TIMESTAMP(0) WITH TIME ZONE DEFAULT NULL;
ALTER TABLE org_billing ADD COLUMN payment_date TIMESTAMP(0) WITH TIME ZONE DEFAULT NULL;
ALTER TABLE org_billing ADD COLUMN billing_name VARCHAR(64) DEFAULT NULL;
ALTER TABLE org_billing ADD COLUMN billing_code VARCHAR(64) DEFAULT NULL;

ALTER TABLE org_billing ALTER COLUMN billing_date SET DATA TYPE DATE;
ALTER TABLE org_billing ALTER COLUMN payment_date SET DATA TYPE DATE;
ALTER TABLE org_billing ALTER COLUMN activation_date SET DATA TYPE DATE;

ALTER TABLE org_billing DROP COLUMN billing_name;
ALTER TABLE org_billing DROP COLUMN account_name;

ALTER TABLE org_billing ADD COLUMN account_code VARCHAR(64) DEFAULT NULL;
