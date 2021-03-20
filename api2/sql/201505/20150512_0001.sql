CREATE TABLE report_keyword (
    rk_id bigserial NOT NULL,
    keyword character varying(255),
    rk_date timestamp with time Zone,
    rk_grouping_key character varying(255),
    rk_grouping_value character varying(255),
    rk_json json
);

ALTER TABLE ONLY report_keyword
    ADD CONSTRAINT report_keyword_pkey PRIMARY KEY (rk_id);