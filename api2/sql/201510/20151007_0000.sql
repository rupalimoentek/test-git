ALTER TABLE org_billing DROP COLUMN billing_date;
ALTER TABLE org_billing DROP COLUMN billing_amount;

CREATE INDEX campaign_campaign_owner_user_id_idx ON campaign (campaign_owner_user_id);
CREATE INDEX campaign_ct_user_ct_user_id_idx ON campaign_ct_user (ct_user_id);
CREATE INDEX call_call_started_idx ON call (call_started);

ALTER TABLE campaign ADD CONSTRAINT campaign_campaign_owner_user_id_fkey FOREIGN KEY (campaign_owner_user_id) REFERENCES ct_user (ct_user_id) ON DELETE CASCADE ON UPDATE CASCADE;
UPDATE ct_user SET ct_user_id=2 WHERE ct_user_id=1;

SELECT nextval('org_unit_org_unit_id_seq');
INSERT INTO org_unit (org_unit_id, org_unit_name, org_unit_parent_id, top_ou_id, billing_id) VALUES ('1', 'Convirza', '1', '1', '1');

INSERT INTO org_unit_detail (org_unit_id) VALUES ('1');

SELECT nextval('ct_user_ct_user_id_seq');
INSERT INTO ct_user (ct_user_id, username, password, first_name, last_name, role_id, ct_user_ou_id) VALUES ('1', 'support@convirza.com', '0b59ac1c23623133f9787b0bdd5fd5cf112af7ed', 'Support', 'Admin', '1', '1');

INSERT INTO ct_user_detail (ct_user_id, timezone) VALUES ('1', 'America/New_York');
