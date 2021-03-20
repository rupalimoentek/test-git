-- ===== IMPORTANT NOTE ============================================================
-- The MySQL DB must first be cleaned up by running the following:
-- ======= OPTIONAL ===============================================================
-- First in the 'mysql' DB create a user to connect with
INSERT INTO mysql.user (Host, User, Password, Select_priv, Insert_priv, Update_priv, Delete_priv, Process_priv, File_priv, Alter_priv, Create_tmp_table_priv, Lock_tables_priv, Execute_priv, Create_view_priv, Show_view_priv, Create_routine_priv, Alter_routine_priv, Event_priv, Trigger_priv, Create_tablespace_priv)
VALUES ('%', 'pgfdw', PASSWORD('p0576r3S@L'), 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y');

INSERT INTO mysql.db (Host, Db, User, Select_priv, Insert_priv, Update_priv, Delete_priv, Index_priv, Alter_priv, Create_tmp_table_priv, Lock_tables_priv, Create_view_priv, Show_view_priv, Create_routine_priv, Alter_routine_priv, Event_priv, Trigger_priv)
VALUES ('%', 'newcallengine_dev', 'pgfdw', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y', 'Y');


-- ===== These all are executed in the CE3 MySQL DB ===============================

-- The MySQL DB must first be cleaned up by running the following SQL on the MySQL server
UPDATE call_flows SET updated_at=NULL WHERE updated_at='0000-00-00 00:00:00';
UPDATE call_flows SET webhook_enabled=0 WHERE webhook_enabled IS NULL;
ALTER TABLE call_flows CHANGE webhook_enabled webhook_enabled TINYINT(1) NOT NULL DEFAULT 0;

UPDATE call_flows SET spam_filter_enabled=0 WHERE spam_filter_enabled IS NULL;
ALTER TABLE call_flows CHANGE spam_filter_enabled spam_filter_enabled TINYINT(1) NOT NULL DEFAULT 0;

UPDATE call_flows SET vm_enabled=0 WHERE vm_enabled IS NULL;
ALTER TABLE call_flows CHANGE vm_enabled vm_enabled TINYINT(1) NOT NULL DEFAULT 0;

-- change from varchar(255)
ALTER TABLE call_flows CHANGE routable_type routable_type ENUM('GeoRoute', 'IvrRoute', 'IvrRoute2', 'OutboundRoute', 'PercentageBasedRoute', 'ScheduleRoute', 'SimpleRoute') NOT NULL DEFAULT 'SimpleRoute';

-- change from varchar(255)
UPDATE call_flows SET status='inactive' WHERE status!='active';
ALTER TABLE call_flows CHANGE status status ENUM('active', 'inactive') NOT NULL DEFAULT 'inactive';

ALTER TABLE call_flows CHANGE whisper_enabled whisper_enabled TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE call_flows CHANGE app_id app_id ENUM('CT', 'LMC') NOT NULL DEFAULT 'LMC';

UPDATE call_flows SET dnis_as_cid=0 WHERE dnis_as_cid IS NULL;
ALTER TABLE call_flows CHANGE dnis_as_cid dnis_as_cid TINYINT(1) NOT NULL DEFAULT 0;
ALTER TABLE call_flows CHANGE postcall_ivr_enabled postcall_ivr_enabled TINYINT(1) NOT NULL DEFAULT 0;

-- ===== ivr_routes
UPDATE ivr_options2 SET play_disclaimer='never' WHERE play_disclaimer='' OR play_disclaimer IS NULL;
ALTER TABLE ivr_options2 CHANGE play_disclaimer play_disclaimer ENUM('after', 'before', 'never') NOT NULL DEFAULT 'before';
ALTER TABLE ivr_options2 CHANGE target_did target_did VARCHAR(24);

UPDATE ivr_options2 SET vm_enabled=0 WHERE vm_enabled IS NULL;
ALTER TABLE ivr_options2 CHANGE vm_enabled vm_enabled TINYINT(1) NOT NULL DEFAULT 0;

UPDATE ivr_options2 SET webhook_enabled=0 WHERE webhook_enabled IS NULL;
ALTER TABLE ivr_options2 CHANGE webhook_enabled webhook_enabled TINYINT(1) NOT NULL DEFAULT 0;

UPDATE ivr_options2 SET message_enabled=0 WHERE message_enabled IS NULL;
ALTER TABLE ivr_options2 CHANGE message_enabled message_enabled TINYINT(1) NOT NULL DEFAULT 0;

UPDATE ivr_options2 SET whisper_enabled=0 WHERE whisper_enabled IS NULL;
ALTER TABLE ivr_options2 CHANGE whisper_enabled whisper_enabled TINYINT(1) NOT NULL DEFAULT 0;

-- ===== geo_routes
UPDATE geo_routes SET play_branding='0' WHERE play_branding='' OR play_branding IS NULL;
ALTER TABLE geo_routes CHANGE play_branding play_branding TINYINT(1) NOT NULL DEFAULT 0;

UPDATE geo_routes SET strategy='Npa' WHERE strategy='' OR strategy IS NULL;
ALTER TABLE geo_routes CHANGE strategy strategy ENUM('Claimed', 'Npa', 'Zipcode') NOT NULL DEFAULT 'Npa';

-- ===== percentage_routes
ALTER TABLE percentage_route_options CHANGE target_did target_did VARCHAR(24) NOT NULL;

-- ====== end MySQL cleanup ====================================================================

-- new CE3 FDW enum types
-- CREATE TYPE routetype AS ENUM ('GeoRoute', 'IvrRoute', 'IvrRoute2', 'OutboundRoute', 'PercentageBasedRoute', 'ScheduleRoute', 'SimpleRoute');
-- CREATE TYPE disclaimer AS ENUM ('after', 'before', 'never');
-- CREATE TYPE geostrategy AS ENUM ('Claimed', 'Npa', 'Zipcode');
-- CREATE TYPE cestatus AS ENUM ('active', 'inactive');
-- CREATE TYPE appkey AS ENUM ('CT', 'LMC');

CREATE EXTENSION mysql_fdw;

-- *********************************************************************************************
-- =============== local =================================
-- FDW server
CREATE SERVER mysql_ce
FOREIGN DATA WRAPPER mysql_fdw
OPTIONS (host '127.0.0.1', port '3306');

-- FDW user mapping
CREATE USER MAPPING FOR interact
SERVER mysql_ce
OPTIONS (username 'pgfdw', password 'p0576r3S@L');

-- FDW CE3 tables
CREATE FOREIGN TABLE call_flows (
    id 						      INT,
    provisioned_route_id		  INT NOT NULL,
    dnis                          VARCHAR(25),
    message_enabled 			  BOOLEAN DEFAULT false,
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
    whisper_enabled 			  SMALLINT,
    whisper_message               VARCHAR(255),
    spam_filter_key               VARCHAR(1),
    app_id                        VARCHAR(6),
    dnis_as_cid                   BOOLEAN,
    ring_delay                    SMALLINT,
    postcall_ivr_enabled          BOOLEAN,
    postcall_ivr_id               INT,
    wpapi_key                     SMALLINT,
    spam_filter_enabled           BOOLEAN
) SERVER mysql_ce OPTIONS (dbname 'newcallengine_dev', table_name 'call_flows');

-- ivr_routes2
CREATE FOREIGN TABLE ivr_routes2 (
    id                          INT,
    repeat_greeting             BOOLEAN
) SERVER mysql_ce OPTIONS (dbname 'newcallengine_dev', table_name 'ivr_routes2');

-- ivr_options2
CREATE FOREIGN TABLE ivr_options2 (
    id                          INT,
    ivr_route_id                INT,
    value                       INT,
    target_did                  VARCHAR(24),
    ouid                        INT,
    email_to_notify             VARCHAR(255),
    play_disclaimer             VARCHAR(30),
    record_enabled              BOOLEAN,
    vm_enabled                  BOOLEAN,
    message_enabled             BOOLEAN,
    message                     VARCHAR(255)
) SERVER mysql_ce OPTIONS (dbname 'newcallengine_dev', table_name 'ivr_options2');

-- geo_routes
CREATE FOREIGN TABLE geo_routes (
    id                          INT,
    strategy                    VARCHAR(30),
    allow_manual_entry          BOOLEAN,
    play_branding               BOOLEAN,
    radius                      SMALLINT
) SERVER mysql_ce OPTIONS (dbname 'newcallengine_dev', table_name 'geo_routes');

-- geo_options
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
) SERVER mysql_ce OPTIONS (dbname 'newcallengine_dev', table_name 'geo_options');

-- percentage_route
CREATE FOREIGN TABLE percentage_route (
    id                          INT
) SERVER mysql_ce OPTIONS (dbname 'newcallengine_dev', table_name 'percentage_route');

-- percentage_route_options
CREATE FOREIGN TABLE percentage_route_options (
    id                          INT,
    percentage_route_id         INT,
    percentage                  SMALLINT,
    target_did                  VARCHAR(30)
) SERVER mysql_ce OPTIONS (dbname 'newcallengine_dev', table_name 'percentage_route_options');
-- ************ end local **********************************************************************


-- *********************************************************************************************
-- =============== development =================================
-- FDW server
CREATE SERVER mysql_ce
FOREIGN DATA WRAPPER mysql_fdw
OPTIONS (host 'dev.ce3.la.l3.logmycalls.com', port '3306');

-- FDW user mapping
CREATE USER MAPPING FOR interact
SERVER mysql_ce
OPTIONS (username 'pgfdw', password 'p0576r3S@L');

-- FDW CE3 tables
DROP FOREIGN TABLE call_flows;
CREATE FOREIGN TABLE call_flows (
    id 						      INT,
    provisioned_route_id		  INT NOT NULL,
    dnis                          VARCHAR(25),
    message_enabled 			  BOOLEAN DEFAULT false,
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
    whisper_enabled 			  SMALLINT,
    whisper_message               VARCHAR(255),
    spam_filter_key               VARCHAR(1),
    app_id                        VARCHAR(6),
    dnis_as_cid                   BOOLEAN,
    ring_delay                    SMALLINT,
    postcall_ivr_enabled          BOOLEAN,
    postcall_ivr_id               INT,
    wpapi_key                     SMALLINT,
    spam_filter_enabled           BOOLEAN
) SERVER mysql_ce OPTIONS (dbname 'newcallengine_dev', table_name 'call_flows');

-- ivr_routes2
CREATE FOREIGN TABLE ivr_routes2 (
    id                          INT,
    repeat_greeting             BOOLEAN
) SERVER mysql_ce OPTIONS (dbname 'newcallengine_dev', table_name 'ivr_routes2');

-- ivr_options2
DROP FOREIGN TABLE ivr_options2;
CREATE FOREIGN TABLE ivr_options2 (
    id                          INT,
    ivr_route_id                INT,
    value                       INT,
    target_did                  VARCHAR(24),
    ouid                        INT,
    email_to_notify             VARCHAR(255),
    play_disclaimer             VARCHAR(30),
    record_enabled              BOOLEAN,
    vm_enabled                  BOOLEAN,
    message_enabled             BOOLEAN,
    message                     VARCHAR(255)
) SERVER mysql_ce OPTIONS (dbname 'newcallengine_dev', table_name 'ivr_options2');

-- geo_routes
CREATE FOREIGN TABLE geo_routes (
    id                          INT,
    strategy                    VARCHAR(30),
    allow_manual_entry          BOOLEAN,
    play_branding               BOOLEAN,
    radius                      SMALLINT
) SERVER mysql_ce OPTIONS (dbname 'newcallengine_dev', table_name 'geo_routes');

-- geo_options
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
) SERVER mysql_ce OPTIONS (dbname 'newcallengine_dev', table_name 'geo_options');

-- percentage_route
CREATE FOREIGN TABLE percentage_route (
    id                          INT
) SERVER mysql_ce OPTIONS (dbname 'newcallengine_dev', table_name 'percentage_route');

-- percentage_route_options
DROP FOREIGN TABLE percentage_route_options;
CREATE FOREIGN TABLE percentage_route_options (
    id                          INT,
    percentage_route_id         INT,
    percentage                  SMALLINT,
    target_did                  VARCHAR(30)
) SERVER mysql_ce OPTIONS (dbname 'newcallengine_dev', table_name 'percentage_route_options');



-- *********************************************************************************************
-- ============== staging 1 ===================================

CREATE SERVER mysql_ce
FOREIGN DATA WRAPPER mysql_fdw
OPTIONS (host 'stag.ce3-01.la.l3.logmycalls.com', port '3306');

CREATE USER MAPPING FOR interact
SERVER mysql_ce
OPTIONS (username 'restapi', password 'kitOfjotly');

CREATE FOREIGN TABLE call_flows (
    id 						      INT,
    provisioned_route_id		  INT NOT NULL,
    dnis                          VARCHAR(25),
    message_enabled 			  BOOLEAN DEFAULT false,
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
    whisper_enabled 			  SMALLINT,
    whisper_message               VARCHAR(255),
    spam_filter_key               VARCHAR(1),
    app_id                        VARCHAR(6),
    dnis_as_cid                   BOOLEAN,
    ring_delay                    SMALLINT,
    postcall_ivr_enabled          BOOLEAN,
    postcall_ivr_id               INT,
    wpapi_key                     SMALLINT,
    spam_filter_enabled           BOOLEAN
) SERVER mysql_ce OPTIONS (dbname 'newcallengine_stag', table_name 'call_flows');

-- ivr_routes2
CREATE FOREIGN TABLE ivr_routes2 (
    id                          INT,
    repeat_greeting             BOOLEAN
) SERVER mysql_ce OPTIONS (dbname 'newcallengine_stag', table_name 'ivr_routes2');

-- ivr_options2
CREATE FOREIGN TABLE ivr_options2 (
    id                          INT,
    ivr_route_id                INT,
    value                       INT,
    target_did                  VARCHAR(255),
    ouid                        INT,
    play_disclaimer             VARCHAR(30),
    record_enabled              BOOLEAN,
    message                     VARCHAR(255)
) SERVER mysql_ce OPTIONS (dbname 'newcallengine_stag', table_name 'ivr_options2');

-- geo_routes
CREATE FOREIGN TABLE geo_routes (
    id                          INT,
    strategy                    VARCHAR(30),
    allow_manual_entry          BOOLEAN,
    play_branding               BOOLEAN,
    radius                      SMALLINT
) SERVER mysql_ce OPTIONS (dbname 'newcallengine_stag', table_name 'geo_routes');

-- geo_options
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

-- percentage_route
CREATE FOREIGN TABLE percentage_route (
    id                          INT
) SERVER mysql_ce OPTIONS (dbname 'newcallengine_stag', table_name 'percentage_route');

-- percentage_route_options
CREATE FOREIGN TABLE percentage_route_options (
    id                          INT,
    percentage_route_id         INT,
    percentage                  SMALLINT,
    target_did                  VARCHAR(24)
) SERVER mysql_ce OPTIONS (dbname 'newcallengine_stag', table_name 'percentage_route_options');


-- *********************************************************************************************
-- ============== staging 2 ==================================

CREATE SERVER mysql_ce
FOREIGN DATA WRAPPER mysql_fdw
OPTIONS (host 'stag.ce3-02.la.l3.logmycalls.com', port '3306');

CREATE USER MAPPING FOR interact
SERVER mysql_ce
OPTIONS (username 'restapi', password 'kitOfjotly');

CREATE FOREIGN TABLE call_flows (
    id 						      INT,
    provisioned_route_id		  INT NOT NULL,
    dnis                          VARCHAR(25),
    message_enabled 			  BOOLEAN DEFAULT false,
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
    whisper_enabled 			  SMALLINT,
    whisper_message               VARCHAR(255),
    spam_filter_key               VARCHAR(1),
    app_id                        VARCHAR(6),
    dnis_as_cid                   BOOLEAN,
    ring_delay                    SMALLINT,
    postcall_ivr_enabled          BOOLEAN,
    postcall_ivr_id               INT,
    wpapi_key                     SMALLINT,
    spam_filter_enabled           BOOLEAN
) SERVER mysql_ce OPTIONS (dbname 'newcallengine_stag', table_name 'call_flows');

-- ivr_routes2
CREATE FOREIGN TABLE ivr_routes2 (
    id                          INT,
    repeat_greeting             BOOLEAN
) SERVER mysql_ce OPTIONS (dbname 'newcallengine_stag', table_name 'ivr_routes2');

-- ivr_options2
CREATE FOREIGN TABLE ivr_options2 (
    id                          INT,
    ivr_route_id                INT,
    value                       INT,
    target_did                  VARCHAR(255),
    ouid                        INT,
    play_disclaimer             VARCHAR(30),
    record_enabled              BOOLEAN,
    message                     VARCHAR(255)
) SERVER mysql_ce OPTIONS (dbname 'newcallengine_stag', table_name 'ivr_options2');

-- geo_routes
CREATE FOREIGN TABLE geo_routes (
    id                          INT,
    strategy                    VARCHAR(30),
    allow_manual_entry          BOOLEAN,
    play_branding               BOOLEAN,
    radius                      SMALLINT
) SERVER mysql_ce OPTIONS (dbname 'newcallengine_stag', table_name 'geo_routes');

-- geo_options
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

-- percentage_route
CREATE FOREIGN TABLE percentage_route (
    id                          INT
) SERVER mysql_ce OPTIONS (dbname 'newcallengine_stag', table_name 'percentage_route');

-- percentage_route_options
CREATE FOREIGN TABLE percentage_route_options (
    id                          INT,
    percentage_route_id         INT,
    percentage                  SMALLINT,
    target_did                  VARCHAR(30)
) SERVER mysql_ce OPTIONS (dbname 'newcallengine_stag', table_name 'percentage_route_options');


-- *********************************************************************************************
-- ============== production ==================================
CREATE SERVER mysql_ce
FOREIGN DATA WRAPPER mysql_fdw
OPTIONS (host '', port '3306');

CREATE USER MAPPING FOR interact
SERVER mysql_ce
OPTIONS (username 'restapi', password 'kitOfjotly');

CREATE FOREIGN TABLE call_flows (
    id 						      INT,
    provisioned_route_id		  INT NOT NULL,
    dnis                          VARCHAR(25),
    message_enabled 			  BOOLEAN DEFAULT false,
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
    whisper_enabled 			  SMALLINT,
    whisper_message               VARCHAR(255),
    spam_filter_key               VARCHAR(1),
    app_id                        VARCHAR(6),
    dnis_as_cid                   BOOLEAN,
    ring_delay                    SMALLINT,
    postcall_ivr_enabled          BOOLEAN,
    postcall_ivr_id               INT,
    wpapi_key                     SMALLINT,
    spam_filter_enabled           BOOLEAN
) SERVER mysql_ce OPTIONS (dbname 'newcallengine_prod', table_name 'call_flows');

-- ivr_routes2
CREATE FOREIGN TABLE ivr_routes2 (
    id                          INT,
    repeat_greeting             BOOLEAN
) SERVER mysql_ce OPTIONS (dbname 'newcallengine_prod', table_name 'ivr_routes2');

-- ivr_options2
CREATE FOREIGN TABLE ivr_options2 (
    id                          INT,
    ivr_route_id                INT,
    value                       INT,
    target_did                  VARCHAR(255),
    ouid                        INT,
    play_disclaimer             VARCHAR(30),
    record_enabled              BOOLEAN,
    message                     VARCHAR(255)
) SERVER mysql_ce OPTIONS (dbname 'newcallengine_prod', table_name 'ivr_options2');

-- geo_routes
CREATE FOREIGN TABLE geo_routes (
    id                          INT,
    strategy                    VARCHAR(30),
    allow_manual_entry          BOOLEAN,
    play_branding               BOOLEAN,
    radius                      SMALLINT
) SERVER mysql_ce OPTIONS (dbname 'newcallengine_prod', table_name 'geo_routes');

-- geo_options
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
) SERVER mysql_ce OPTIONS (dbname 'newcallengine_prod', table_name 'geo_options');

-- percentage_route
CREATE FOREIGN TABLE percentage_route (
    id                          INT
) SERVER mysql_ce OPTIONS (dbname 'newcallengine_prod', table_name 'percentage_route');

-- percentage_route_options
CREATE FOREIGN TABLE percentage_route_options (
    id                          INT,
    percentage_route_id         INT,
    percentage                  SMALLINT,
    target_did                  VARCHAR(30)
) SERVER mysql_ce OPTIONS (dbname 'newcallengine_prod', table_name 'percentage_route_options');



-- *********************************************************************************************
-- execute grant for all environments
GRANT SELECT, UPDATE, INSERT ON call_flows TO interact;
GRANT SELECT, UPDATE, INSERT ON ivr_routes2 TO interact;
GRANT SELECT, UPDATE, INSERT ON ivr_options2 TO interact;
GRANT SELECT, UPDATE, INSERT ON geo_routes TO interact;
GRANT SELECT, UPDATE, INSERT ON geo_options TO interact;
GRANT SELECT, UPDATE, INSERT ON percentage_route TO interact;
GRANT SELECT, UPDATE, INSERT ON percentage_route_options TO interact;
