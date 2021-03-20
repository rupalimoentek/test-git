-- scheduled reports schema

CREATE TYPE fileformat AS ENUM  ('CSV', 'PDF', 'HTML');
CREATE TYPE schedunit AS ENUM ('daily', 'weekly', 'monthly', 'quarterly');
CREATE TYPE calrange AS ENUM ('today', 'yesterday', 'last_week', 'last_30', 'this_month', 'last_month');
CREATE TYPE report AS ENUM ('acq_group', 'acq_campaign', 'acq_callflow', 'acq_keyword', 'acq_source', 'call_detail', 'call_back', 'activity_stream', 'group_activity', 'callflow_setting');

CREATE TABLE filter (
    filter_id 					SERIAL NOT NULL,
    ct_user_id					INT NOT NULL REFERENCES ct_user (ct_user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    report_used  				report NOT NULL,
    filter_start 				DATE DEFAULT NULL,
    filter_end 					DATE DEFAULT NULL,
    filter_range 				calrange DEFAULT NULL,
    filter_status               status NOT NULL DEFAULT 'active',
    filter_created 				DATE NOT NULL DEFAULT CURRENT_DATE,
    filter_modified 			TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL,
    CHECK ((filter_start IS NOT NULL AND filter_end IS NOT NULL AND filter_range IS NULL) OR (filter_start IS NULL AND filter_end IS NULL AND filter_range IS NOT NULL)),
    PRIMARY KEY (filter_id)
);
CREATE OR REPLACE RULE get_pkey_on_insert AS ON INSERT TO filter DO  SELECT currval('filter_filter_id_seq'::text::regclass) AS filter_id;

CREATE TABLE filter_rule (
    filter_rule_id				SERIAL NOT NULL,
    filter_id 					INT NOT NULL REFERENCES filter (filter_id) ON DELETE CASCADE ON UPDATE CASCADE,
    filter_key  				VARCHAR(64),
    comparator 					VARCHAR(2),
    filter_value 				VARCHAR(64),
    PRIMARY KEY (filter_rule_id)
);
CREATE OR REPLACE RULE get_pkey_on_insert AS ON INSERT TO filter_rule DO  SELECT currval('filter_rule_filter_rule_id_seq'::text::regclass) AS filter_rule_id;

CREATE TABLE report_sched (
    report_id					SERIAL NOT NULL,
    ct_user_id					INT NOT NULL REFERENCES ct_user (ct_user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    filter_id 					INT DEFAULT NULL REFERENCES filter (filter_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    report_name                 VARCHAR(64) NOT NULL,
    report_desc 				VARCHAR(255),
    report_status 				status NOT NULL DEFAULT 'active',
    report_created 				DATE NOT NULL DEFAULT CURRENT_DATE,
    report_modified 			DATE DEFAULT NULL,
    PRIMARY KEY (report_id)
);
CREATE OR REPLACE RULE get_pkey_on_insert AS ON INSERT TO report_sched DO  SELECT currval('report_sched_report_id_seq'::text::regclass) AS report_id;

CREATE TABLE schedule (
    schedule_id 				SERIAL NOT NULL,
    report_id					INT NOT NULL REFERENCES report_sched (report_id) ON DELETE CASCADE ON UPDATE CASCADE,
    schedule_name				VARCHAR(64),
    schedule_status				status NOT NULL DEFAULT 'active',
    freq_unit					schedunit NOT NULL DEFAULT 'weekly',
    freq_value					SMALLINT,
    format						fileformat NOT NULL DEFAULT 'CSV',
    list_id 					INT NOT NULL REFERENCES email_list (list_id) ON DELETE CASCADE ON UPDATE CASCADE,
    message                     TEXT,
    schedule_created 			DATE NOT NULL DEFAULT CURRENT_DATE,
    schedule_modified 			DATE DEFAULT NULL,
    from_label                  VARCHAR(128),
    PRIMARY KEY (schedule_id)
);
CREATE OR REPLACE RULE get_pkey_on_insert AS ON INSERT TO schedule DO  SELECT currval('schedule_schedule_id_seq'::text::regclass) AS schedule_id;

CREATE TABLE schedule_history (
    history_id                  SERIAL NOT NULL,
    schedule_id                 INT NOT NULL REFERENCES schedule (schedule_id) ON DELETE CASCADE ON UPDATE CASCADE,
    report_file                 VARCHAR(64) NOT NULL,
    file_path                   VARCHAR(128),
    recipient                   VARCHAR(128)[] NOT NULL,
    date_sent                   TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (history_id)
);