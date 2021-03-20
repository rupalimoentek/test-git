CREATE TABLE report_dni_log_temp (
    rdlt_id bigserial NOT NULL,
    call_id integer,
    keyword character varying(255),
    first_page character varying(255),
	last_page character varying(255),
	source character varying(255),
	medium character varying(255)
);

ALTER TABLE ONLY report_dni_log_temp
    ADD CONSTRAINT report_dni_log_temp_pkey PRIMARY KEY (rdlt_id);