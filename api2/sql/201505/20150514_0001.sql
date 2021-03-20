
-- Column: analytic_status

-- ALTER TABLE call_detail DROP COLUMN analytic_status;

ALTER TABLE call_detail ADD COLUMN analytic_status character varying(20);
ALTER TABLE call_detail ALTER COLUMN analytic_status SET NOT NULL;
ALTER TABLE call_detail ALTER COLUMN analytic_status SET DEFAULT 'none'::character varying;

ALTER TABLE report_keyword ADD COLUMN campaign_id integer;

ALTER TABLE ONLY report_keyword
    ADD CONSTRAINT report_keyword_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES campaign(campaign_id) ON UPDATE CASCADE ON DELETE CASCADE;

