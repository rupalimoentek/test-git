
-- ***** IMPORTANT ************************************************
-- NOTE: You will want to make sure that the foreign database defined is using the READ/WRITE master instance of MySQL
-- This is because these tables will be used to create new routes from the new API as well as will be used by the CT API
-- code once we implement number pools.  It's more than likely it's currently set to use the READ ONLY instance - if so,
-- then it will be necessary to wipe the previous definitions and create new ones

-- ===== Do only if wiping previous definition ====================
--DROP FOREIGN TABLE ivr_routes2;
--DROP FOREIGN TABLE geo_routes;
--DROP FOREIGN TABLE geo_options;
--DROP FOREIGN TABLE percentage_route;
--DROP FOREIGN TABLE percentage_route_options;

DROP SERVER mysql_ce CASCADE;

CREATE SERVER mysql_ce
FOREIGN DATA WRAPPER mysql_fdw
OPTIONS (host 'stag.ce3-02.la.l3.logmycalls.com', port '3306');

CREATE USER MAPPING FOR interact
SERVER mysql_ce
OPTIONS (username 'restapi', password 'kitOfjotly');

-- ===== end wipe of previous definition =========================

-- modify the FDW tables
--DROP FOREIGN TABLE call_flows;
--DROP FOREIGN TABLE ivr_options2;

CREATE FOREIGN TABLE call_flows (
    id 						      INT,
    provisioned_route_id		  INT NOT NULL,
    dnis                          VARCHAR(25),
    message_enabled 			  BOOLEAN,
    message                       VARCHAR(255),
    default_ringto				  VARCHAR(255),
    ouid                          INT,
    caller_to_sms                 VARCHAR(255),
    email_to_notify               VARCHAR(255),
    play_disclaimer 			  VARCHAR(32),
    created_at                    TIMESTAMP(0) WITHOUT TIME ZONE,
    updated_at                    TIMESTAMP(0) WITHOUT TIME ZONE,
    country_code                  VARCHAR(10),
    tx_boost                      INT,
    rx_boost                      INT,
    vm_enabled                    BOOLEAN,
    routable_type                 VARCHAR(32),
    routable_id                   INT,
    webhook_enabled               BOOLEAN,
    status                        VARCHAR(20),
    record_until 				  TIMESTAMP(0) WITHOUT TIME ZONE,
    whisper_enabled 			  BOOLEAN,
    whisper_message               VARCHAR(255),
    app_id                        VARCHAR(6),
    dnis_as_cid                   BOOLEAN,
    ring_delay                    SMALLINT,
    postcall_ivr_enabled          BOOLEAN,
    postcall_ivr_id               INT,
    spam_ivr                      SMALLINT,
    spam_threshold                SMALLINT,
    spam_filter_enabled           BOOLEAN
) SERVER mysql_ce OPTIONS (dbname 'newcallengine_stag', table_name 'call_flows');

CREATE FOREIGN TABLE ivr_options2 (
    id                          INT,
    ivr_route_id                INT,
    value                       INT,
    target_did                  VARCHAR(255),
    ouid                        INT,
    email_to_notify				VARCHAR(255),
    play_disclaimer             VARCHAR(30),
    record_enabled              BOOLEAN,
    vm_enabled 					BOOLEAN,
    webhook_enabled 			BOOLEAN,
    message_enabled				BOOLEAN,
    message                     VARCHAR(255),
    whisper_enabled 			BOOLEAN,
    whisper_message 			VARCHAR(255),
    created_at 					TIMESTAMP(0) WITHOUT TIME ZONE,
    updated_at 					TIMESTAMP(0) WITHOUT TIME ZONE
) SERVER mysql_ce OPTIONS (dbname 'newcallengine_stag', table_name 'ivr_options2');

CREATE FOREIGN TABLE schedule_routes (
    id							INT,
    timezone 					INT
) SERVER mysql_ce OPTIONS (dbname 'newcallengine_stag', table_name 'schedule_routes');

CREATE FOREIGN TABLE schedule_options (
    id 							INT,
    schedule_route_id			INT,
    target_did					VARCHAR(255),
    ouid						INT,
    day							SMALLINT,
    from_time 					SMALLINT,
    to_time						SMALLINT,
    created_at					TIMESTAMP(0) WITHOUT TIME ZONE,
    updated_at 					TIMESTAMP(0) WITHOUT TIME ZONE
) SERVER mysql_ce OPTIONS (dbname 'newcallengine_stag', table_name 'schedule_options');

-- ===== full rebuild start =======================================================
CREATE FOREIGN TABLE ivr_routes2 (
    id                          INT,
    repeat_greeting             BOOLEAN
) SERVER mysql_ce OPTIONS (dbname 'newcallengine_stag', table_name 'ivr_routes2');

CREATE FOREIGN TABLE geo_routes (
    id                          INT,
    strategy                    VARCHAR(30),
    allow_manual_entry          BOOLEAN,
    play_branding               BOOLEAN,
    radius                      SMALLINT
) SERVER mysql_ce OPTIONS (dbname 'newcallengine_stag', table_name 'geo_routes');

CREATE FOREIGN TABLE geo_options (
    id                          INT,
    geo_route_id                INT,
    target_did                  VARCHAR(24),
    ouid                        INT,
    latitude                    NUMERIC(7, 4),
    longitude                   NUMERIC(7, 4),
    address                     VARCHAR(255),
    city                        VARCHAR(128),
    created_at                  TIMESTAMP(0) WITHOUT TIME ZONE,
    updated_at                  TIMESTAMP(0) WITHOUT TIME ZONE
) SERVER mysql_ce OPTIONS (dbname 'newcallengine_stag', table_name 'geo_options');

CREATE FOREIGN TABLE percentage_route (
    id                          INT
) SERVER mysql_ce OPTIONS (dbname 'newcallengine_stag', table_name 'percentage_route');

CREATE FOREIGN TABLE percentage_route_options (
    id                          INT,
    percentage_route_id         INT,
    percentage                  SMALLINT,
    target_did                  VARCHAR(30)
) SERVER mysql_ce OPTIONS (dbname 'newcallengine_stag', table_name 'percentage_route_options');

-- ===== full rebuild end =========================================================

GRANT SELECT, UPDATE, INSERT, DELETE ON call_flows TO interact;
GRANT SELECT, UPDATE, INSERT, DELETE ON ivr_routes2 TO interact;
GRANT SELECT, UPDATE, INSERT, DELETE ON ivr_options2 TO interact;
GRANT SELECT, UPDATE, INSERT, DELETE ON geo_routes TO interact;
GRANT SELECT, UPDATE, INSERT, DELETE ON geo_options TO interact;
GRANT SELECT, UPDATE, INSERT, DELETE ON percentage_route TO interact;
GRANT SELECT, UPDATE, INSERT, DELETE ON percentage_route_options TO interact;
GRANT SELECT, UPDATE, INSERT, DELETE ON schedule_routes TO interact;
GRANT SELECT, UPDATE, INSERT, DELETE ON schedule_options TO interact;

-- ===== TESTING QUERIES ==========================================================
SELECT * FROM call_flows LIMIT 10;
SELECT * FROM geo_routes LIMIT 10;
SELECT * FROM geo_options LIMIT 10;
SELECT * FROM ivr_routes2 LIMIT 10;
SELECT * FROM ivr_options2 LIMIT 10;
SELECT * FROM percentage_route LIMIT 10;
SELECT * FROM percentage_route_options LIMIT 10;
SELECT * FROM schedule_routes LIMIT 10;
SELECT * FROM schedule_options LIMIT 10;
