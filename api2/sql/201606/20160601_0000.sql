-- remove duplicate phone_numbers from production db
-- delete from provisioned_route where provisioned_route_id in (5708,5706,5687,5707,5684,5688,5692,5705,5686);
-- delete from phone_number where phone_number_id in (21470,21468,21451,21469,21448,21452,21454,21467,21381,21382,21450);

-- modifying table structure for new centralized phone numbers
ALTER TABLE provisioned_route_number DROP CONSTRAINT provisioned_route_number_phone_number_id_fkey;
ALTER TABLE reserved_number DROP CONSTRAINT reserved_number_phone_number_id_fkey;
ALTER TABLE phone_number DROP CONSTRAINT phone_number_vendor_id_fkey;

-- create temporary tables to use for migrating data
CREATE TABLE phone_temp (
	number_id				BIGINT,
	npa 					SMALLINT NOT NULL,
	nxx 					SMALLINT NOT NULL,
	ocn 					SMALLINT NOT NULL,
	number 					BIGINT,
	number_str 				VARCHAR(10),
	rate_center 			VARCHAR(16),
	number_type 			VARCHAR(32) NOT NULL DEFAULT 'did',
	number_status 			VARCHAR(64) NOT NULL DEFAULT 'unprovisioned'
);
CREATE TABLE phone_detail_temp (
	number_id				BIGINT,
	number_added 			DATE,
	vendor_id 				INT
);
-- copy data to temp tables
INSERT INTO phone_detail_temp
	SELECT phone_number_id AS number_id, phone_number_created AS number_added, vendor_id FROM phone_number;
WITH ph_copy AS (
	SELECT phone_number_id AS number_id, npa, CAST(substring(number::text from 4 for 3) AS SMALLINT) AS nxx, CAST(substring(number::text from 7 for 4) AS SMALLINT) AS ocn, number, number::text AS number_str, 'did' AS phone_type, phone_number_status
	FROM phone_number
)
INSERT INTO phone_temp
	SELECT * FROM ph_copy;

-- remove the original phone_number table and ENUMS
DROP TABLE phone_number;
DROP TYPE numtype;
DROP TYPE num_status;

-- New TYPE to create
CREATE TYPE phtype AS ENUM ('did', 'tfn');
CREATE TYPE phstatus AS ENUM ('provisioned', 'unprovisioned', 'suspended', 'deleted', 'reserved');
CREATE TYPE origin AS ENUM ('CT', 'LMC', 'MisD', 'CT_Pool', 'LMC_Pool', 'Call_Loop');

CREATE TABLE number_owner (
	owner_id 				SERIAL NOT NULL,
	owner_name 				VARCHAR(64) NOT NULL,
	PRIMARY KEY (owner_id)
);
INSERT INTO number_owner (owner_name) VALUES ('Convirza'),('Shell'),('Thompson'),('Kinnear'),('Reserved');

CREATE TABLE phone_number (
	number_id 				BIGSERIAL NOT NULL,
	npa 					SMALLINT NOT NULL,
	nxx 					SMALLINT NOT NULL,
	ocn 					SMALLINT NOT NULL,
	number 					BIGINT,
	number_str 				VARCHAR(10),
	rate_center 			VARCHAR(20),
	number_type 			phtype NOT NULL DEFAULT 'did',
	number_status 			phstatus NOT NULL DEFAULT 'unprovisioned',
	CHECK (number > 100000000 AND number < 9999999999),
	UNIQUE (number),
	PRIMARY KEY (number_id)
);
CREATE INDEX phone_number_npa_number_status_idx ON phone_number (npa, number_status);
CREATE INDEX phone_number_npa_nxx_status_idx ON phone_number (npa, nxx, number_status);
CREATE INDEX phone_number_number_str_status_idx ON phone_number (number_str, number_status);
CREATE INDEX phone_number_number_idx ON phone_number (number);

-- change the phone type for all records
UPDATE phone_temp SET number_type='did';

INSERT INTO phone_number
	SELECT number_id, npa, nxx, ocn, number, number_str, NULL AS rate_center, number_type::phtype, number_status::phstatus FROM phone_temp;

CREATE TABLE phone_detail (
	number_id 				BIGINT NOT NULL REFERENCES phone_number (number_id) ON DELETE CASCADE ON UPDATE CASCADE,
	lata 					INT DEFAULT NULL,
	app_id 					origin DEFAULT NULL,
	org_unit_id 			INT DEFAULT NULL REFERENCES org_unit (org_unit_id) ON DELETE CASCADE ON UPDATE CASCADE,
	provisioned_route_id	INT DEFAULT NULL REFERENCES provisioned_route (provisioned_route_id) ON DELETE CASCADE ON UPDATE CASCADE,
	num_pr_id 				INT DEFAULT NULL,
	num_ou_id 				INT DEFAULT NULL,
	vendor_id 				INT DEFAULT NULL REFERENCES phone_vendor (vendor_id) ON DELETE CASCADE ON UPDATE CASCADE,
	resporg_id				VARCHAR(5) DEFAULT NULL,
	owner_id 				INT NOT NULL DEFAULT 1 REFERENCES number_owner (owner_id) ON DELETE CASCADE ON UPDATE CASCADE,
	tier					SMALLINT NOT NULL DEFAULT 0,
	ported 					BOOLEAN DEFAULT NULL,
	state 					CHAR(2),
	city 					VARCHAR(128),
	zip						VARCHAR(6),
	number_added 			DATE NOT NULL DEFAULT CURRENT_DATE,
	number_updated			DATE DEFAULT NULL,
	CHECK (tier >= 0 AND tier <= 100),
	PRIMARY KEY (number_id)
);
COMMENT ON COLUMN phone_detail.num_pr_id IS 'Provisioned route ID of application using number';
COMMENT ON COLUMN phone_detail.num_ou_id IS 'Organizational unit of the application using number';
COMMENT ON COLUMN phone_detail.ported IS 'Values intretpeted as: false=in, true=out, null=no';

INSERT INTO phone_detail (number_id, number_added, vendor_id)
	SELECT * FROM phone_detail_temp;

-- remove the temp tables
DROP TABLE phone_temp;
DROP TABLE phone_detail_temp;

CREATE TABLE phone_pool (
	pool_id 				SERIAL NOT NULL,
	org_unit_id 			INT DEFAULT NULL REFERENCES org_unit (org_unit_id) ON DELETE CASCADE ON UPDATE CASCADE,
	provisioned_route_id	INT DEFAULT NULL REFERENCES provisioned_route (provisioned_route_id) ON DELETE CASCADE ON UPDATE CASCADE,
	pool_pr_id 				INT DEFAULT NULL,
	pool_ou_id 				INT DEFAULT NULL,
	pool_name 				VARCHAR(64),
	keep_alive_mins 		SMALLINT NOT NULL DEFAULT 5,
	number_count 			SMALLINT NOT NULL DEFAULT 0,
	pool_created 			DATE NOT NULL DEFAULT CURRENT_DATE,
	pool_updated 			TIMESTAMP(0) without time zone DEFAULT NULL,
	PRIMARY KEY (pool_id)
);
COMMENT ON COLUMN phone_pool.pool_pr_id IS 'Provisioned route ID of application using number';
COMMENT ON COLUMN phone_pool.pool_ou_id IS 'Organizational unit of the application using number';

CREATE TABLE phone_pool_number (
	pool_id 				INT NOT NULL REFERENCES phone_pool (pool_id) ON DELETE CASCADE ON UPDATE CASCADE,
	number_id 				BIGINT NOT NULL REFERENCES phone_number (number) ON DELETE CASCADE ON UPDATE CASCADE,
	last_used 				TIMESTAMP(0) without time zone DEFAULT CURRENT_TIMESTAMP,
	phone_number 			BIGINT NOT NULL,
	UNIQUE (number_id),
	PRIMARY KEY (pool_id, number_id)
);

CREATE TABLE log_phone (
	log_phone_id 			BIGSERIAL NOT NULL,
	number_id 				BIGINT NOT NULL REFERENCES phone_number (number) ON DELETE CASCADE ON UPDATE CASCADE,
	ct_user_id 				INT DEFAULT NULL REFERENCES ct_user (ct_user_id) ON DELETE SET NULL ON UPDATE CASCADE,
	org_unit_id 			INT DEFAULT NULL REFERENCES org_unit (org_unit_id) ON DELETE SET NULL ON UPDATE CASCADE,
	app_id 					origin NOT NULL DEFAULT 'LMC',
	action 					VARCHAR(24),
	previous_value 			VARCHAR(64),
	log_date 				TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
	log_data				JSON,
	PRIMARY KEY (log_phone_id)
);

-- add authorizations
GRANT SELECT, UPDATE, INSERT, DELETE ON phone_number TO interact;
GRANT SELECT, UPDATE, INSERT, DELETE ON phone_detail TO interact;
GRANT SELECT, UPDATE, INSERT, DELETE ON phone_pool TO interact;
GRANT SELECT, UPDATE, INSERT, DELETE ON phone_pool_number TO interact;
GRANT SELECT, UPDATE, INSERT, DELETE ON log_phone TO interact;
GRANT SELECT, UPDATE ON phone_number_number_id_seq TO interact;
GRANT SELECT, UPDATE ON phone_number_pool_pool_id_seq TO interact;
GRANT SELECT, UPDATE ON log_phone_log_phone_id_seq TO interact;

-- **************************************
-- improvements to existing tables
DROP TABLE campaign_channel;

ALTER TABLE provisioned_route DROP COLUMN description;
ALTER TABLE provisioned_route DROP COLUMN provider_id;
ALTER TABLE provisioned_route DROP COLUMN product_id;
ALTER TABLE provisioned_route DROP COLUMN play_disclaimer;
ALTER TABLE provisioned_route DROP COLUMN mine;
ALTER TABLE provisioned_route DROP COLUMN phone_number_modified;

ALTER TABLE provisioned_route ADD COLUMN channel_id INT DEFAULT NULL REFERENCES channel (channel_id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE provisioned_route_number ADD COLUMN pool_id BIGINT DEFAULT NULL REFERENCES phone_pool (pool_id) ON DELETE SET NULL ON UPDATE CASCADE;
-- NOTE: later we will want to poin
ALTER TABLE provisioned_route_number ALTER COLUMN phone_number_id DROP NOT NULL;

-- ALTER TABLE phone_number ALTER COLUMN ocn DROP NOT NULL;
-- ALTER TABLE phone_number ALTER COLUMN nxx DROP NOT NULL;
-- ***** IMPORTANT STEP *************************************
-- NOTE: Now you will need to re-import phone numbers into the newly structured phone_number table
-- Simply import the CSV file that was manipulated from the original table data earlier

ALTER TABLE provisioned_route_number ADD CONSTRAINT provisioned_route_number_phone_number_id_fkey FOREIGN KEY (phone_number_id) REFERENCES phone_number (number_id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE provisioned_route_channel DROP CONSTRAINT provisioned_route_channel_provisioned_route_id_fkey;
ALTER TABLE provisioned_route_channel DROP CONSTRAINT provisioned_route_channel_channel_id_fkey;

-- migrate the channel_id data from one table to the other
UPDATE provisioned_route SET channel_id=prc.channel_id FROM provisioned_route pr, provisioned_route_channel prc WHERE pr.provisioned_route_id=prc.provisioned_route_id;

-- handle view
DROP VIEW v_call_details;
CREATE VIEW v_call_details AS
	SELECT c.call_id,
		ou.org_unit_id,
		ou.org_unit_name,
		c.provisioned_route_id,
		camp.campaign_id,
		camp.campaign_ext_id,
		camp.campaign_name,
		ch.category,
		ch.sub_category,
		c.disposition,
		c.duration,
		c.source,
		c.tracking,
		c.ring_to,
		c.repeat_call,
		c.call_started,
		cd.call_ended,
		cd.call_created,
		cd.dni_log_id,
		cd.is_outbound,
		cd.call_mine_status,
		cd.mined_timestamp,
		cd.ring_to_name,
		cd.analytic_status,
		cd.channel_id,
		cd.cdr_source,
		cd.recording_file::text || '.mp3'::text AS recording_file,
		ce.call_data AS append_data
	FROM call c
		LEFT JOIN call_detail cd ON cd.call_id = c.call_id
		LEFT JOIN call_extend ce ON ce.call_id = c.call_id
		LEFT JOIN campaign_provisioned_route cpr ON cpr.provisioned_route_id = c.provisioned_route_id
		LEFT JOIN campaign camp ON camp.campaign_id = cpr.campaign_id
		LEFT JOIN org_unit ou ON ou.org_unit_id = camp.campaign_ou_id
		LEFT JOIN provisioned_route pr ON (c.provisioned_route_id = pr.provisioned_route_id)
		LEFT JOIN channel ch ON (pr.channel_id = ch.channel_id);



DROP TABLE provisioned_route_channel;

-- ALTER TABLE provisioned_route_number ADD CONSTRAINT provisioned_route_number_phone_number_id_fkey FOREIGN KEY (phone_number_id) REFERENCES phone_number (number_id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE reserved_number ADD CONSTRAINT reserved_number_phone_number_id_fkey FOREIGN KEY (phone_number_id) REFERENCES phone_number (number_id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE campaign ALTER COLUMN campaign_modified SET DATA TYPE TIMESTAMP(0) WITHOUT TIME ZONE;
ALTER TABLE provisioned_route ALTER COLUMN provisioned_route_modified SET DATA TYPE TIMESTAMP(0) WITHOUT TIME ZONE;
ALTER TABLE provisioned_route ALTER COLUMN provisioned_route_created SET DATA TYPE TIMESTAMP(0) WITHOUT TIME ZONE;
ALTER TABLE provisioned_route_number ALTER COLUMN date_assigned SET DATA TYPE TIMESTAMP(0) WITHOUT TIME ZONE;
ALTER TABLE call_action ALTER COLUMN action_created SET DATA TYPE TIMESTAMP(0) WITHOUT TIME ZONE;
ALTER TABLE call_action ALTER COLUMN action_updated SET DATA TYPE TIMESTAMP(0) WITHOUT TIME ZONE;

ALTER TABLE call_action_rule ALTER COLUMN rule_created SET DATA TYPE TIMESTAMP(0) WITHOUT TIME ZONE;
ALTER TABLE call_flow_recording ALTER COLUMN call_flow_recording_created SET DATA TYPE TIMESTAMP(0) WITHOUT TIME ZONE;
ALTER TABLE org_doubleclick ALTER COLUMN created SET DATA TYPE TIMESTAMP(0) WITHOUT TIME ZONE;

CREATE RULE get_pkey_on_insert AS ON INSERT TO phone_number DO  SELECT currval(('phone_number_number_id_seq'::text)::regclass) AS number_id;

UPDATE phone_detail SET app_id='CT';

-- ALTER TABLE phone_detail ALTER COLUMN zip SET DATA TYPE VARCHAR(6);

INSERT INTO phone_vendor (vendor_id, vendor_name, vendor_started) VALUES (11, 'Intermedia', '2015-10-22');
-- reset sequence to the correct value
SELECT setval('phone_vendor_vendor_id_seq', 11);




