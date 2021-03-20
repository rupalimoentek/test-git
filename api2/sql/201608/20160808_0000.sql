-- add enforcement at the DB level
-- NOTE: it will be necessary to remove all duplicates before placing this constraint
ALTER TABLE campaign_ct_user ADD CONSTRAINT campaign_ct_user_campaign_id_ct_user_id_key UNIQUE (campaign_id, ct_user_id);

ALTER TABLE ct_user_detail ALTER add_to_campaigns SET DEFAULT true