CREATE TABLE report_group (
    rg_id bigserial NOT NULL,
    org_unit_id integer,
    rg_date timestamp with time Zone,
    rg_grouping_key character varying(255),
    rg_grouping_value character varying(255),
    rg_json json
);

ALTER TABLE public.report_group OWNER TO interact;

ALTER TABLE ONLY report_group
    ADD CONSTRAINT report_group_pkey PRIMARY KEY (rg_id);
    
ALTER TABLE ONLY report_group
    ADD CONSTRAINT report_group_org_unit_id_fkey FOREIGN KEY (org_unit_id) REFERENCES org_unit(org_unit_id) ON UPDATE CASCADE ON DELETE CASCADE;
	
CREATE TABLE report_definition_object
(
  rdo_id bigserial NOT NULL,
  rdo_report_id integer,
  rdo_report_name character varying(64),
  data json,
  CONSTRAINT report_definition_object_pkey PRIMARY KEY (rdo_id)
)	