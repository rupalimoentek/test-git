
ALTER TABLE subscription ALTER COLUMN subscription_external_id TYPE VARCHAR(36);
ALTER TABLE org_account ADD COLUMN ext_billing_id VARCHAR(36);