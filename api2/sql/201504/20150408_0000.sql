DROP TABLE location_option;

CREATE TABLE location_route (
	location_route_id		    SERIAL NOT NULL,
	location_id			        INT NOT NULL REFERENCES location (location_id) ON UPDATE CASCADE ON DELETE CASCADE,
	location_route_location		VARCHAR(100) NOT NULL,
	location_route_address		VARCHAR(100) NOT NULL,
	location_route_city			VARCHAR(100) NOT NULL,
	location_route_state		CHAR(2) NOT NULL,
	location_route_zip		    VARCHAR(16) NOT NULL,
	location_route_target		BIGINT NOT NULL,
	location_route_claimed_zip 	VARCHAR(255) NULL,
	location_route_latitude		NUMERIC(16,3) NOT NULL,
	location_route_longitude	NUMERIC(16,3) NOT NULL,
	location_route_created		TIMESTAMP(0) without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
	location_route_modified		TIMESTAMP(0) without time zone DEFAULT NULL,
	location_route_active		BOOLEAN NOT NULL DEFAULT true,
	PRIMARY KEY (location_route_id)
);