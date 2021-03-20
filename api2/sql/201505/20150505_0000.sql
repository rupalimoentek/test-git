CREATE TABLE report_home (
    rh_id bigserial NOT NULL,
    org_unit_id integer,
    rh_date timestamp with time Zone,
    rh_json json
);

ALTER TABLE ONLY report_home
    ADD CONSTRAINT report_home_pkey PRIMARY KEY (rh_id);
	
ALTER TABLE ONLY report_home
    ADD CONSTRAINT report_home_org_unit_id_fkey FOREIGN KEY (org_unit_id) REFERENCES org_unit(org_unit_id) ON UPDATE CASCADE ON DELETE CASCADE;