-- fix some bad table definitions
UPDATE campaign SET campaign_start_date=NOW() WHERE campaign_id IN (SELECT campaign_id FROM campaign WHERE campaign_start_date IS NULL);
ALTER TABLE campaign ALTER COLUMN campaign_owner_user_id SET NOT NULL;
ALTER TABLE campaign ALTER COLUMN campaign_start_date SET NOT NULL;
