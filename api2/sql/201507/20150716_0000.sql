-- Adjust time columns in billing
ALTER TABLE org_billing ALTER COLUMN activation_date SET DATA TYPE TIMESTAMP(0) with time zone;
ALTER TABLE org_billing ALTER COLUMN cycle_start SET DATA TYPE TIMESTAMP(0) with time zone;
ALTER TABLE org_billing ALTER COLUMN cycle_end SET DATA TYPE TIMESTAMP(0) with time zone;

INSERT INTO component (component_name) VALUES ('Billing');
-- Note the primary key should be 24

INSERT INTO scope (scope_code, scope_display, scope_desc) VALUES ('billing', 'Billing Accounting', 'Zuora billing integration for client accounting');
-- Note the primary key should be 29

INSERT INTO subscription_component (subscription_id, component_id) VALUES ('8', '24'), ('9', '24'), ('10', '24');

INSERT INTO role_access (role_id, scope_id, component_id, permission) VALUES ('1', '29', '24', '7'), ('4', '29', '24', '7');