-- try to fix some of the old org_unit records
UPDATE org_unit SET top_ou_id=org_unit_id WHERE org_unit_parent_id IS NULL;
UPDATE org_unit SET top_ou_id=40 WHERE org_unit_parent_id=40 OR org_unit_parent_id=49;
UPDATE org_unit SET top_ou_id=37 WHERE org_unit_parent_id=37;
UPDATE org_unit SET top_ou_id=91 WHERE org_unit_parent_id=91;
UPDATE org_unit SET top_ou_id=8 WHERE org_unit_parent_id=8 OR org_unit_parent_id=9 OR org_unit_parent_id=10 OR org_unit_parent_id=1 OR org_unit_parent_id=11 OR org_unit_parent_id=71;

-- make sure no invalid records exist
DELETE FROM org_unit WHERE top_ou_id IS NULL;

-- change columns for time zones
ALTER TABLE log_call_action ALTER COLUMN log_date TYPE TIMESTAMP(0) with time zone;
ALTER TABLE log_call_flow ALTER COLUMN log_date TYPE TIMESTAMP(0) with time zone;
ALTER TABLE log_campaign ALTER COLUMN log_date TYPE TIMESTAMP(0) with time zone;
ALTER TABLE log_integration ALTER COLUMN log_date TYPE TIMESTAMP(0) with time zone;
ALTER TABLE log_user ALTER COLUMN log_date TYPE TIMESTAMP(0) with time zone;
ALTER TABLE log_webhook ALTER COLUMN log_date TYPE TIMESTAMP(0) with time zone;

ALTER TABLE call ALTER COLUMN call_started TYPE TIMESTAMP(0) with time zone;
ALTER TABLE call_detail ALTER COLUMN call_ended TYPE TIMESTAMP(0) with time zone;
ALTER TABLE call_detail ALTER COLUMN call_created TYPE TIMESTAMP(0) with time zone;
ALTER TABLE call_detail ALTER COLUMN mined_timestamp TYPE TIMESTAMP(0) with time zone;

ALTER TABLE campaign ALTER COLUMN campaign_start_date TYPE TIMESTAMP(0) with time zone;
ALTER TABLE campaign ALTER COLUMN campaign_end_date TYPE TIMESTAMP(0) with time zone;

ALTER TABLE ct_user_detail RENAME time_zone_id TO timezone;
ALTER TABLE ct_user_detail ALTER COLUMN timezone TYPE VARCHAR(5);
ALTER TABLE ct_user_detail ALTER COLUMN timezone SET DEFAULT '-0700';
UPDATE ct_user_detail SET timezone='-0700' WHERE timezone IS NULL;
ALTER TABLE ct_user_detail ALTER COLUMN timezone SET NOT NULL;


INSERT INTO ct_user_detail (ct_user_id) (SELECT u.ct_user_id FROM ct_user u LEFT JOIN ct_user_detail d ON (u.ct_user_id=d.ct_user_id) WHERE d.ct_user_id IS NULL);
