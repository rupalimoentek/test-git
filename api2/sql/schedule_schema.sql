-- Creates the schedule DB and user account to access it
CREATE DATABASE schedule ENCODING=UTF8 TEMPLATE=template1;
CREATE USER schedule PASSWORD 'FryRikBams';

CREATE TABLE schedule (
 	task_id 				serial NOT NULL,
 	start_date 				timestamp(0) with time zone NOT NULL DEFAULT now(),
 	end_date 				timestamp(0) with time zone DEFAULT NULL::timestamp with time zone,
 	next_run_date 			timestamp(0) without time zone,
 	min character 			varying(8) NOT NULL DEFAULT '0'::character varying,
 	hour character 			varying(8) NOT NULL DEFAULT '0'::character varying,
 	day_of_month 			character varying(32) NOT NULL DEFAULT '0'::character varying,
 	month 					character varying(16) NOT NULL DEFAULT '0'::character varying,
 	day_of_week 			character varying(8) NOT NULL DEFAULT '0'::character varying,
	reference_id 			bigint,
 	task_type 				character varying(24) NOT NULL,
 	task_data 				character varying(100) NOT NULL,
 	PRIMARY KEY (task_id)
);

CREATE INDEX schedule_next_run_type_idx ON schedule USING btree (next_run_date, task_type COLLATE pg_catalog."default");
ALTER TABLE schedule OWNER TO schedule;

