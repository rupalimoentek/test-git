
CREATE TABLE report_campaign (
    rc_id bigserial NOT NULL,
    campaign_id integer,
    rc_date timestamp with time Zone,
    rc_grouping_key character varying(255),
    rc_grouping_value character varying(255),
    rc_json json
);

ALTER TABLE ONLY report_campaign
    ADD CONSTRAINT report_campaign_pkey PRIMARY KEY (rc_id);
	
ALTER TABLE ONLY report_campaign
    ADD CONSTRAINT report_campaign_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES campaign(campaign_id) ON UPDATE CASCADE ON DELETE CASCADE;
	
ALTER TABLE report_call_flow ALTER COLUMN rcf_date TYPE timestamp with time Zone;
