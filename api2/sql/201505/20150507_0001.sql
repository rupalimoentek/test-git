CREATE TABLE report_call_flow (
    rcf_id bigserial NOT NULL,
    provisioned_route_id integer,
    rcf_date timestamp with time Zone,
    rcf_grouping_key character varying(255),
    rcf_grouping_value character varying(255),
    rcf_json json
);

ALTER TABLE public.report_call_flow OWNER TO interact;

ALTER TABLE ONLY report_call_flow
    ADD CONSTRAINT report_call_flow_pkey PRIMARY KEY (rcf_id);
    
ALTER TABLE ONLY report_call_flow
    ADD CONSTRAINT report_call_flow_provisioned_route_id_fkey FOREIGN KEY (provisioned_route_id) REFERENCES provisioned_route(provisioned_route_id) ON UPDATE CASCADE ON DELETE CASCADE;
    