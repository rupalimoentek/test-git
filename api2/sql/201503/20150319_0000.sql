
-- --- disposition types
CREATE TYPE disposition_type AS ENUM ('ANSWERED', 'BUSY', 'FAILED', 'NO ANSWER', 'NONE');
CREATE TYPE mine_status AS ENUM ('not mined', 'mined', 'pending', 'none');
CREATE TYPE cdr AS ENUM ('CE', 'API', 'BVR', 'NONE');

-- ------ Call Details ------------------
CREATE TABLE call (
    call_id                                 BIGSERIAL NOT NULL,
    provisioned_route_id                    INT DEFAULT NULL REFERENCES provisioned_route (provisioned_route_id) ON DELETE CASCADE ON UPDATE CASCADE,
    org_unit_id                             INT NOT NULL REFERENCES org_unit (org_unit_id) ON DELETE CASCADE ON UPDATE CASCADE,
    disposition                             disposition_type NOT NULL DEFAULT 'NONE',
    duration                                INT NOT NULL DEFAULT 0,
    source                                  INT NOT NULL,
    tracking                                INT NOT NULL,
    ring_to                                 INT,
    repeat_call                             BOOLEAN NOT NULL DEFAULT false,
    call_started                            TIMESTAMP without time zone NOT NULL,
    PRIMARY KEY (call_id)
);
CREATE INDEX call_org_unit_id_idx ON call (org_unit_id);
CREATE INDEX call_provisioned_route_id_idx ON call (provisioned_route_id);
CREATE INDEX call_org_unit_id_provisioned_route_id_idx ON call (org_unit_id, provisioned_route_id);
CREATE INDEX call_call_started_idx ON call (call_started);

CREATE TABLE call_detail (
    call_id                                 BIGINT NOT NULL REFERENCES call (call_id) ON DELETE CASCADE ON UPDATE CASCADE,
    bill_second                             INT NOT NULL DEFAULT 0,
    external_id                             VARCHAR(100),
    recording_file                          VARCHAR(128),
    ring_to_name                            VARCHAR(255),
    call_value                              INT,
    dni_log_id                              VARCHAR(50),
    is_outbound                             BOOLEAN NOT NULL DEFAULT false,
    call_mine_status                        mine_status NOT NULL DEFAULT 'none',
    cdr_source                              cdr NOT NULL DEFAULT 'NONE',
    call_ended                              TIMESTAMP without time zone DEFAULT NULL,
    call_created                            TIMESTAMP without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    mined_timestamp                         TIMESTAMP without time zone DEFAULT NULL,
    PRIMARY KEY (call_id)
);
CREATE INDEX call_detail_call_id_call_mine_status_idx ON call_detail (call_id, call_mine_status);

CREATE TABLE call_extend (
    call_id                                 BIGINT NOT NULL REFERENCES call (call_id) ON DELETE CASCADE ON UPDATE CASCADE,
    call_data                               JSON,
    PRIMARY KEY (call_id)
);

CREATE TYPE dc_type AS ENUM ('action', 'transaction');
CREATE TYPE dc_map_type AS ENUM ('metric', 'dimension');

-- ------ indicator ---------------------
CREATE TABLE indicator (
    indicator_id 			    SERIAL NOT NULL,
    indicator_name              VARCHAR(96) NOT NULL,
    external_id                 INT,
    indicator_active            BOOLEAN NOT NULL DEFAULT true,
    indicator_created           DATE NOT NULL DEFAULT CURRENT_DATE,
    PRIMARY KEY (indicator_id)
);

CREATE TABLE indicator_score (
    score_id                    BIGSERIAL NOT NULL,
    call_id                     BIGINT NOT NULL REFERENCES call (call_id) ON DELETE CASCADE ON UPDATE CASCADE,
    indicator_id                INT NOT NULL REFERENCES indicator (indicator_id) ON DELETE CASCADE ON UPDATE CASCADE,
    score_value                 SMALLINT,
    UNIQUE (call_id, indicator_id),
    PRIMARY KEY (score_id)
);

-- ------ Call Details ------------------
CREATE TABLE org_doubleclick (
    doubleclick_id 			    SERIAL NOT NULL,
    org_unit_id				    INT NOT NULL REFERENCES org_unit (org_unit_id) ON DELETE CASCADE ON UPDATE CASCADE,
    conversion_type			    dc_type NOT NULL DEFAULT 'action',
    min_call_duration 		    SMALLINT NOT NULL DEFAULT 0,
    indicator_id 			    INT DEFAULT NULL REFERENCES indicator (indicator_id) ON DELETE SET NULL ON UPDATE CASCADE,
    metric_threshold 		    SMALLINT,
    threshold_above 		    BOOLEAN NOT NULL DEFAULT false,
    default_floodlight 		    VARCHAR(128),
    currency 				    VARCHAR(3) NOT NULL DEFAULT 'USD',
    dc_active 				    BOOLEAN NOT NULL DEFAULT false,
    created 				    TIMESTAMP without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (org_unit_id),
    PRIMARY KEY (doubleclick_id)
);

CREATE TABLE org_dc_map (
    dc_map_id					SERIAL NOT NULL,
    double_click_id		        INT NOT NULL REFERENCES org_doubleclick (doubleclick_id) ON DELETE CASCADE ON UPDATE CASCADE,
    indicator_id 			    INT DEFAULT NULL REFERENCES indicator (indicator_id) ON DELETE SET NULL ON UPDATE CASCADE,
    metric_field 			    VARCHAR(64),
    floodlight_var 			    VARCHAR(64) NOT NULL,
    map_type 				    dc_map_type NOT NULL DEFAULT 'metric',
    created 				    TIMESTAMP without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (dc_map_id)
);

CREATE TABLE doubleclick_call (
    dc_call_id 					SERIAL NOT NULL,
    call_id 			        BIGINT NOT NULL REFERENCES call (call_id) ON DELETE CASCADE ON UPDATE CASCADE,
    session_id 				    VARCHAR(64) NOT NULL,
    gclid 					    VARCHAR(32) NOT NULL,
    call_timestamp 			    TIMESTAMP without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    call_mine_status 		    mine_status NOT NULL DEFAULT 'none',
    revenue_micros 			    INT DEFAULT NULL,
    segmentation_name 		    VARCHAR(64),
    currency 				    VARCHAR(3) NOT NULL DEFAULT 'USD',
    conversion_type			    dc_type NOT NULL DEFAULT 'action',
    date_sent 				    TIMESTAMP without time zone DEFAULT NULL,
    sync_error 				    VARCHAR(128) DEFAULT NULL,
    PRIMARY KEY (dc_call_id)
);
CREATE INDEX doubleclick_call_date_sent_status_error_idx ON doubleclick_call (date_sent, call_mine_status, sync_error);

CREATE TABLE doubleclick_metric (
    call_metric_id 				SERIAL NOT NULL,
    dc_call_id 	                INT NOT NULL REFERENCES doubleclick_call (dc_call_id) ON DELETE CASCADE ON UPDATE CASCADE,
    indicator_id 			    INT DEFAULT NULL REFERENCES indicator (indicator_id) ON DELETE SET NULL ON UPDATE CASCADE,
    floodlight_var			    VARCHAR(64) NOT NULL,
    metric_field 			    VARCHAR(64),
    metric_value 			    VARCHAR(64),
    map_type 				    dc_map_type NOT NULL DEFAULT 'metric',
    PRIMARY KEY (call_metric_id)
);

CREATE RULE get_pkey_on_insert AS
    ON INSERT TO call DO  SELECT currval(('call_call_id_seq'::text)::regclass) AS call_id;
