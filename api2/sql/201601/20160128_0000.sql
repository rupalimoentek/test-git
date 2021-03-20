-- add combined field to channel for querying
ALTER TABLE channel ADD COLUMN cat_combo VARCHAR(96);
UPDATE channel SET cat_combo=concat(category, ':', sub_category);

CREATE TYPE routetype AS ENUM ('GeoRoute', 'IvrRoute', 'IvrRoute2', 'OutboundRoute', 'PercentageBasedRoute', 'ScheduleRoute', 'SimpleRoute');
CREATE TYPE cestatus AS ENUM ('active', 'inactive');
CREATE TYPE app AS ENUM ('CT', 'LMC');

-- ****************************************************************************
-- NOTE: the following requires that the MySQL foreign data wrapper be installed first and must be executed as admin user
CREATE EXTENSION mysql_fdw;

-- ****************************************************************************
-- ********************** WARNING - ENVIRONMENT SPECIFIC **********************
-- development
CREATE SERVER mysql_ce
FOREIGN DATA WRAPPER mysql_fdw
OPTIONS (host 'dev.ce3.la.l3.logmycalls.com', port '3306');
-- staging 1
CREATE SERVER mysql_ce
FOREIGN DATA WRAPPER mysql_fdw
OPTIONS (host 'stag.ce3-01.la.l3.logmycalls.com', port '3306');
-- staging 2
CREATE SERVER mysql_ce
FOREIGN DATA WRAPPER mysql_fdw
OPTIONS (host 'stag.ce3-02.la.l3.logmycalls.com', port '3306');

-- ****************************************************************************
-- NOTE: this requires some setup on the MySQL side of things to have this user available
-- development
CREATE USER MAPPING FOR interact
SERVER mysql_ce
OPTIONS (username 'pgfdw', password 'p0576r3S@L');
-- staging 1
CREATE USER MAPPING FOR interact
SERVER mysql_ce
OPTIONS (username 'restapi', password 'kitOfjotly');
-- staging 2
CREATE USER MAPPING FOR interact
SERVER mysql_ce
OPTIONS (username 'restapi', password 'kitOfjotly');


--CREATE FOREIGN TABLE call_flows (
--     id 						   INT,
--     provisioned_route_id		   INT NOT NULL,
--     dnis                          VARCHAR(25),
--     message_enabled 			   BOOLEAN DEFAULT false,
--     message                       VARCHAR(255),
--     default_ringto				   VARCHAR(255),
--     ouid                          INT,
--     caller_to_sms                 VARCHAR(255),
--     email_to_notify               VARCHAR(255),
--     play_disclaimer 			   VARCHAR(255),
--     created_at                    TIMESTAMP(0) WITHOUT TIME ZONE,
--     updated_at                    TIMESTAMP(0) WITHOUT TIME ZONE,
--     country_code                  VARCHAR(10),
--     tx_boost                      INT,
--     rx_boost                      INT,
--     vm_enabled                    BOOLEAN,
--     routable_type                 VARCHAR(255),
--     routable_id                   INT,
--     webhook_enabled               BOOLEAN,
--     status                        VARCHAR(255),
--     record_until 				   TIMESTAMP(0) WITHOUT TIME ZONE,
--     whisper_enabled 			   SMALLINT,
--     whisper_message               VARCHAR(255),
--     spam_filter_key               CHAR(1),
--     app_id                        VARCHAR(10),
--     dnis_as_cid                   BOOLEAN,
--     ring_delay                    BOOLEAN,
--     postcall_ivr_enabled          BOOLEAN,
--     postcall_ivr_id               INT,
--     wpapi_key                     VARCHAR(1),
--     spam_filter_enabled           BOOLEAN
--)
--SERVER mysql_ce
--OPTIONS (dbname 'ce3', table_name 'call_flows');

-- ****************************************************************************
-- NOTE: this requires some setup on the MySQL side of things to have this user available
-- development
CREATE FOREIGN TABLE call_flows (
    id 						    INT,
    provisioned_route_id		INT NOT NULL,
    dnis                        VARCHAR(25),
    default_ringto				VARCHAR(128),
    play_disclaimer 			VARCHAR(16),
    whisper_enabled 			BOOLEAN,
    message_enabled 			BOOLEAN,
    record_until 				TIMESTAMP(0) WITHOUT TIME ZONE,
    routable_id 				INT,
    routable_type               VARCHAR(48)
)
SERVER mysql_ce
OPTIONS (dbname 'newcallengine_dev', table_name 'call_flows');
-- staging 1
CREATE FOREIGN TABLE call_flows (
    id 						    INT,
    provisioned_route_id		INT NOT NULL,
    dnis                        VARCHAR(25),
    default_ringto				VARCHAR(128),
    play_disclaimer 			VARCHAR(16),
    whisper_enabled 			BOOLEAN,
    message_enabled 			BOOLEAN,
    record_until 				TIMESTAMP(0) WITHOUT TIME ZONE,
    routable_id 				INT,
    routable_type               VARCHAR(48),
    status                      VARCHAR(20)
)
SERVER mysql_ce
OPTIONS (dbname 'newcallengine_stag', table_name 'call_flows');
-- staging 2
CREATE FOREIGN TABLE call_flows (
    id 						    INT,
    provisioned_route_id		INT NOT NULL,
    dnis                        VARCHAR(25),
    default_ringto				VARCHAR(128),
    play_disclaimer 			VARCHAR(16),
    whisper_enabled 			BOOLEAN,
    message_enabled 			BOOLEAN,
    record_until 				TIMESTAMP(0) WITHOUT TIME ZONE,
    routable_id 				INT,
    routable_type               VARCHAR(48),
    status                      VARCHAR(20)
)
SERVER mysql_ce
OPTIONS (dbname 'newcallengine_stag', table_name 'call_flows');

-- ****************************************************************************
-- NOTE: this requires some setup on the MySQL side of things to have this user available
-- development
CREATE FOREIGN TABLE ivr_options2 (
     id                            INT,
     ivr_route_id                  INT,
     value                         INT,
     target_did                    VARCHAR(255),
     ouid                          INT,
     email_to_notify               VARCHAR(255),
     play_disclaimer               VARCHAR(255),
     record_enabled                BOOLEAN,
     vm_enabled                    BOOLEAN,
     webhook_enabled               BOOLEAN,
     message_enabled               BOOLEAN,
     message                       VARCHAR(255),
     whisper_enabled               BOOLEAN,
     whisper_message               VARCHAR(255),
     created_at                    TIMESTAMP(0) WITHOUT TIME ZONE,
     updated_at                    TIMESTAMP(0) WITHOUT TIME ZONE
)
SERVER mysql_ce
OPTIONS (dbname 'newcallengine_dev', table_name 'ivr_options2');
-- staging 1
CREATE FOREIGN TABLE ivr_options2 (
    id                            INT,
    ivr_route_id                  INT,
    value                         INT,
    target_did                    VARCHAR(255),
    ouid                          INT,
    email_to_notify               VARCHAR(255),
    play_disclaimer               VARCHAR(255),
    record_enabled                BOOLEAN,
    vm_enabled                    BOOLEAN,
    webhook_enabled               BOOLEAN,
    message_enabled               BOOLEAN,
    message                       VARCHAR(255),
    whisper_enabled               BOOLEAN,
    whisper_message               VARCHAR(255),
    created_at                    TIMESTAMP(0) WITHOUT TIME ZONE,
    updated_at                    TIMESTAMP(0) WITHOUT TIME ZONE
)
SERVER mysql_ce
OPTIONS (dbname 'newcallengine_stag', table_name 'ivr_options2');
-- staging 2
CREATE FOREIGN TABLE ivr_options2 (
    id                            INT,
    ivr_route_id                  INT,
    value                         INT,
    target_did                    VARCHAR(255),
    ouid                          INT,
    email_to_notify               VARCHAR(255),
    play_disclaimer               VARCHAR(255),
    record_enabled                BOOLEAN,
    vm_enabled                    BOOLEAN,
    webhook_enabled               BOOLEAN,
    message_enabled               BOOLEAN,
    message                       VARCHAR(255),
    whisper_enabled               BOOLEAN,
    whisper_message               VARCHAR(255),
    created_at                    TIMESTAMP(0) WITHOUT TIME ZONE,
    updated_at                    TIMESTAMP(0) WITHOUT TIME ZONE
)
SERVER mysql_ce
OPTIONS (dbname 'newcallengine_stag', table_name 'ivr_options2');

-- ****************************************************************************
-- NOTE: this requires some setup on the MySQL side of things to have this user available
-- development
CREATE FOREIGN TABLE percentage_route_options (
     id                            INT,
     percentage_route_id           INT,
     percentage                    SMALLINT,
     target_did                    BIGINT
)
SERVER mysql_ce
OPTIONS (dbname 'newcallengine_dev', table_name 'percentage_route_options');
-- staging 1
CREATE FOREIGN TABLE percentage_route_options (
    id                            INT,
    percentage_route_id           INT,
    percentage                    SMALLINT,
    target_did                    BIGINT
)
SERVER mysql_ce
OPTIONS (dbname 'newcallengine_stag', table_name 'percentage_route_options');
-- staging 2
CREATE FOREIGN TABLE percentage_route_options (
    id                            INT,
    percentage_route_id           INT,
    percentage                    SMALLINT,
    target_did                    BIGINT
)
SERVER mysql_ce
OPTIONS (dbname 'newcallengine_stag', table_name 'percentage_route_options');

-- ==============================================================
-- run this for all environments
GRANT SELECT, UPDATE, INSERT ON call_flows TO interact;
GRANT SELECT, UPDATE, INSERT ON ivr_options2 TO interact;
GRANT SELECT, UPDATE, INSERT ON percentage_route_options TO interact;

-- On the MySQL DB it is important to run these
-- UPDATE call_flows SET updated_at=NULL WHERE updated_at = '0000-00-00 00:00:00';
-- UPDATE call_flows SET created_at=NULL WHERE created_at = '0000-00-00 00:00:00';
-- UPDATE call_flows SET record_until=NULL WHERE record_until = '0000-00-00 00:00:00';

-- ==============================================================
-- setup for MongoDB dni_logs

CREATE EXTENSION mongo_fdw;

CREATE SERVER mongo_server FOREIGN DATA WRAPPER mongo_fdw
OPTIONS (address '38.64.65.87', port '27017');

CREATE FOREIGN TABLE dni_logs (
    _id 									NAME,
    "data.created_at" 						TIMESTAMP(0) WITH TIME ZONE,
    "data.destination_url"					VARCHAR(2048),
    "data.organizational_unit_id"			INT,
    "data.location_details.country_code"	CHAR(2),
    "data.location_details.country_name"	VARCHAR(128),
    "data.location_details.region_code" 	VARCHAR(32),
    "data.location_details.region_name" 	VARCHAR(128),
    "data.location_details.city" 			VARCHAR(128),
    "data.location_details.zipcode" 		VARCHAR(16),
    "data.location_details.latitude" 		NUMERIC(15,12),
    "data.location_details.longitude"		NUMERIC(15,12),
    "data.location_details.metro_code" 		SMALLINT,
    "data.location_details.area_code" 		SMALLINT,
    "data.ref_param.gclid" 					VARCHAR(255),
    "data.ref_param.gclsrc"					VARCHAR(128),
    "data.ref_param.utm_campaign"			VARCHAR(255),
    "data.ref_param.utm_medium"				VARCHAR(255),
    "data.ref_parram.kw"					VARCHAR(255),
    "data.referring" 						VARCHAR(2048),
    "data.referring_type" 					VARCHAR(64),
    "data.referring_url" 					VARCHAR(2048),
    "data.search_words" 					VARCHAR(128),
    "data.session_id" 						VARCHAR(48),
    "data.first_page"						VARCHAR(2048),
    "data.last_page"						VARCHAR(2048)
)
SERVER mongo_server
OPTIONS (database 'big_data_api_staging', collection 'ct_dni_logs');

CREATE FOREIGN TABLE phone_number_pools (
     _id 								VARCHAR(32),
     created_at 						TIMESTAMP(0) WITH TIME ZONE,
     app_id 							VARCHAR(3),
     keep_alive_minutes 				SMALLINT,
     name 								VARCHAR(128),
     organizational_unit_id 			BIGINT,
     phone_number 						TEXT[],
     pool_id 							INT,
     provisioned_route_id 				INT,
     rate_center 						VARCHAR(128)[],
     state 								CHAR(2),
     updated_at 						TIMESTAMP(0) WITH TIME ZONE
)
SERVER mongo_server
OPTIONS (database 'big_data_api_development', collection 'phone_number_pools');

GRANT SELECT, UPDATE, INSERT ON dni_logs TO interact;
GRANT SELECT, UPDATE, INSERT ON phone_number_pools TO interact;
