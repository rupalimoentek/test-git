CREATE TABLE location (
	location_id		            SERIAL NOT NULL,
    org_unit_id                 INT NOT NULL REFERENCES org_unit (org_unit_id) ON DELETE CASCADE ON UPDATE CASCADE,
	location_name	            VARCHAR(100) NOT NULL,
	location_created	        TIMESTAMP(0) without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
	location_modified	        TIMESTAMP(0) without time zone DEFAULT NULL,
	location_active		        BOOLEAN NOT NULL DEFAULT true,
	PRIMARY KEY (location_id)
);

CREATE RULE get_pkey_on_insert AS ON INSERT TO location DO SELECT currval('location_location_id_seq'::text) AS location_id;

CREATE TABLE location_option (
	location_option_id		    SERIAL NOT NULL,
	location_id			        INT NOT NULL REFERENCES location (location_id) ON UPDATE CASCADE ON DELETE CASCADE,
	location_option_location	VARCHAR(100) NOT NULL,
	location_option_address		VARCHAR(100) NOT NULL,
	location_option_city		VARCHAR(100) NOT NULL,
	location_option_state		CHAR(2) NOT NULL,
	location_option_zip		    VARCHAR(16) NOT NULL,
	location_option_target		INT NOT NULL,
	location_option_latitude	NUMERIC(16,3) NOT NULL,
	location_option_longitude	NUMERIC(16,3) NOT NULL,
	location_option_created		TIMESTAMP(0) without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
	location_option_modified	TIMESTAMP(0) without time zone DEFAULT NULL,
	location_option_active		BOOLEAN NOT NULL DEFAULT true,
	PRIMARY KEY (location_option_id)
);

ALTER TABLE location_option ADD COLUMN location_option_claimed_zip VARCHAR(255) NOT NULL;
ALTER TABLE location_option ALTER COLUMN location_option_target TYPE BIGINT;