--
ALTER TABLE ct_user ADD COLUMN add_to_campaigns BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE tag (
    tag_id              SERIAL NOT NULL,
    org_unit_id         INT NOT NULL REFERENCES org_unit (org_unit_id) ON UPDATE CASCADE ON DELETE CASCADE,
    tag_name            VARCHAR(100) NOT NULL,
    tag_created         TIMESTAMP(0) without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    tag_active          BOOLEAN NOT NULL DEFAULT true,
    PRIMARY KEY (tag_id)
);

CREATE TABLE call_tag (
    call_id             INT NOT NULL REFERENCES call (call_id) ON DELETE CASCADE ON UPDATE CASCADE,
    tag_id              INT NOT NULL REFERENCES tag (tag_id) ON DELETE CASCADE ON UPDATE CASCADE,
    PRIMARY KEY (call_id, tag_id)
);

CREATE TABLE comment (
    comment_id          SERIAL NOT NULL,
    comment_parent_id   INT DEFAULT NULL REFERENCES comment (comment_id) ON DELETE SET NULL ON UPDATE CASCADE,
    call_id             BIGINT NOT NULL REFERENCES call (call_id) ON DELETE CASCADE ON UPDATE CASCADE,
    ct_user_id          INT NOT NULL REFERENCES ct_user (ct_user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    comment_text        TEXT NOT NULL,
    comment_created     TIMESTAMP(0) without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    comment_modified    TIMESTAMP(0) without time zone DEFAULT NULL,
    comment_active      BOOLEAN NOT NULL DEFAULT true,
    PRIMARY KEY (comment_id)
);

CREATE TABLE  ivr_key (
    ivr_key_id          SERIAL NOT NULL,
    key                 VARCHAR(40) NOT NULL,
    call_id             BIGINT NOT NULL REFERENCES call (call_id) ON DELETE CASCADE ON UPDATE CASCADE,
    ivr_created         TIMESTAMP(0) without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (ivr_key_id)
);

CREATE RULE get_pkey_on_insert AS ON INSERT TO ct_user DO SELECT currval('ct_user_ct_user_id_seq'::text) AS ct_user_id;
CREATE RULE get_pkey_on_insert AS ON INSERT TO call DO SELECT currval('call_call_id_seq'::text) AS call_id;

CREATE TYPE callaction AS ENUM('email_alert', 'sms_alert', 'tag_call', 'post_event', 'webhook', 'post_detail', 'callback', 'none');

CREATE TABLE call_action (
    action_id               SERIAL NOT NULL,
    phone_number_id         INT NOT NULL REFERENCES phone_number (phone_number_id) ON DELETE CASCADE ON UPDATE CASCADE,
    post_process            BOOLEAN NOT NULL DEFAULT false,
    action_order            SMALLINT NOT NULL DEFAULT 1,
    action                  callaction NOT NULL DEFAULT 'none',
    action_target           VARCHAR(255),
    action_created          TIMESTAMP(0) without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    action_updated          TIMESTAMP(0) without time zone DEFAULT NULL,
    PRIMARY KEY (action_id)
);
CREATE RULE get_pkey_on_insert AS ON INSERT TO call_action DO SELECT currval('call_action_action_id_seq'::text) AS action_id;

CREATE TABLE call_action_rule (
    rule_id                 SERIAL NOT NULL,
    action_id               INT NOT NULL REFERENCES call_action (action_id) ON DELETE CASCADE ON UPDATE CASCADE,
    data_field              VARCHAR(128),
    indicator_id            INT DEFAULT NULL REFERENCES indicator (indicator_id) ON DELETE CASCADE ON UPDATE CASCADE,
    operator                VARCHAR(9) NOT NULL,
    comparator              VARCHAR(128),
    join_type               VARCHAR(3) NOT NULL DEFAULT 'AND',
    rule_order              SMALLINT NOT NULL DEFAULT 1,
    grouping                SMALLINT NOT NULL DEFAULT 1,
    rule_created            TIMESTAMP(0) without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    rule_updated            TIMESTAMP(0) without time zone DEFAULT NULL,
    CHECK (join_type='AND' OR join_type='OR' OR join_type='NONE'),
    PRIMARY KEY (rule_id)
);

CREATE TABLE trigger (
    trigger_id              SERIAL NOT NULL,
    trigger_name            VARCHAR(64) NOT NULL,
    trigger_desc            VARCHAR(255),
    trigger_file            VARCHAR(128),
    trigger_point           VARCHAR(128),
    trigger_active          BOOLEAN NOT NULL DEFAULT true,
    trigger_created         DATE NOT NULL DEFAULT CURRENT_DATE,
    PRIMARY KEY (trigger_id)
);

CREATE TABLE trigger_field (
    field_id                SERIAL NOT NULL,
    trigger_id              INT NOT NULL REFERENCES trigger (trigger_id) ON DELETE CASCADE ON UPDATE CASCADE,
    display_name            VARCHAR(128),
    column_name             VARCHAR(128),
    table_name              VARCHAR(128),
    field_group             VARCHAR(64),
    PRIMARY KEY (field_id)
);

CREATE TABLE trigger_rule (
    rule_id                 SERIAL NOT NULL,
    trigger_id              INT NOT NULL REFERENCES trigger (trigger_id) ON DELETE CASCADE ON UPDATE CASCADE,
    field_id                INT DEFAULT NULL REFERENCES trigger_field (field_id) ON DELETE CASCADE ON UPDATE CASCADE,
    field_entry             VARCHAR(64) DEFAULT NULL,
    rule_condition          VARCHAR(9) NOT NULL DEFAULT '=',
    rule_value              VARCHAR(128),
    rule_order              SMALLINT NOT NULL DEFAULT 1,
    PRIMARY KEY (rule_id)
);

CREATE TYPE httpmethod AS ENUM ('GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'TRACE');
CREATE TYPE export_format AS ENUM ('XML', 'CSV', 'JSON', 'FORM-URLENCODED');

CREATE TABLE webhook (
    webhook_id              SERIAL NOT NULL,
    trigger_id              INT NOT NULL REFERENCES trigger (trigger_id) ON DELETE CASCADE ON UPDATE CASCADE,
    org_unit_id             INT NOT NULL REFERENCES org_unit (org_unit_id) ON DELETE CASCADE ON UPDATE CASCADE,
    webhook_name            VARCHAR(128),
    webhook_desc            VARCHAR(255),
    target_url              VARCHAR(255),
    http_method             httpmethod NOT NULL DEFAULT 'GET',
    response_format         export_format NOT NULL DEFAULT 'JSON',
    field_group             VARCHAR(64) DEFAULT NULL,
    webhook_active          BOOLEAN NOT NULL DEFAULT true,
    webhook_created         TIMESTAMP(0) without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    webhook_updated         TIMESTAMP(0) without time zone DEFAULT NULL,
    PRIMARY KEY (webhook_id)
);
CREATE RULE get_pkey_on_insert AS ON INSERT TO webhook DO SELECT currval('webhook_webhook_id_seq'::text) AS webhook_id;

CREATE TABLE webhook_map (
    webhook_map_id          SERIAL NOT NULL,
    parent_map_id           INT DEFAULT NULL REFERENCES webhook_map (webhook_map_id) ON DELETE SET NULL ON UPDATE CASCADE,
    webhook_id              INT NOT NULL REFERENCES webhook (webhook_id) ON DELETE CASCADE ON UPDATE CASCADE,
    field_id                INT DEFAULT NULL REFERENCES trigger_field (field_id) ON DELETE CASCADE ON UPDATE CASCADE,
    field_name              VARCHAR(128),
    field_value             VARCHAR(128),
    map_order               SMALLINT NOT NULL DEFAULT 1,
    map_created             TIMESTAMP(0) without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (webhook_map_id)
);

CREATE TABLE webhook_rule (
    webhook_rule_id         SERIAL NOT NULL,
    webhook_id              INT NOT NULL REFERENCES webhook (webhook_id) ON DELETE CASCADE ON UPDATE CASCADE,
    condition_field         INT DEFAULT NULL REFERENCES trigger_field (field_id) ON DELETE SET NULL ON UPDATE CASCADE,
    condition_operator      VARCHAR(9) NOT NULL DEFAULT '=',
    condition_value         VARCHAR(128),
    rule_created            TIMESTAMP without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (webhook_rule_id)
);


INSERT INTO indicator (indicator_name) VALUES
    ('Appointment Set'),
    ('Commitment to Buy'),
    ('Initial Purchase'),
    ('Payment Language'),
    ('Request for Info'),
    ('Reservation Made'),
    ('Set Phone Appointment'),
    ('All Conversion (c)'),
    ('Cancellation'),
    ('Complaints'),
    ('Compliments'),
    ('Objection Language'),
    ('Escalation Request'),
    ('Politeness'),
    ('Repeat Inquiry'),
    ('Dissatisfaction (c)'),
    ('Agent Politeness'),
    ('Phone Etiquette (c)'),
    ('Agent Empathy'),
    ('Polite Hold Protocol'),
    ('Transfer Permission'),
    ('Lead Score (c)'),
    ('Repeat Sales Inquiry'),
    ('Acquired Address'),
    ('Acquired Email'),
    ('Acquired Name'),
    ('Acquired Phone Number'),
    ('Sales Inquiry'),
    ('Existing Customer'),
    ('Sales Skills (c)'),
    ('Requested Lead Source'),
    ('Ownership Language'),
    ('Ask for Business'),
    ('Build Credibility'),
    ('Determine Needs'),
    ('Buyer Confusion'),
    ('Promotion Mention'),
    ('Missed Opportunity (c)'),
    ('LMC Dev Test'),
    ('Verbal Clarity'),
    ('No Availability'),
    ('Service Not Provided'),
    ('No Coverage'),
    ('Price Shopper'),
    ('Promotional Mention'),
    ('Wrong Number'),
    ('Autoattendant'),
    ('Transfer to Customer Care'),
    ('Transfer to Billing'),
    ('Percent Silence'),
    ('Agitation Level'),
    ('Voice Message'),
    ('Repeat Contact 72 Hrs'),
    ('NES User One'),
    ('NES User Two'),
    ('NES User Three'),
    ('NES User Four'),
    ('NES User Five'),
    ('Options'),
    ('Consumer Proposal'),
    ('Help');

-- to make numbers searchable they
ALTER TABLE call ALTER COLUMN source TYPE VARCHAR(20);
ALTER TABLE call ALTER COLUMN tracking TYPE VARCHAR(20);
ALTER TABLE call ALTER COLUMN ring_to TYPE VARCHAR(20);

ALTER TABLE log_user ALTER COLUMN log_date TYPE TIMESTAMP(6) without time zone;
ALTER TABLE log_campaign ALTER COLUMN log_date TYPE TIMESTAMP(6) without time zone;

ALTER TABLE indicator ADD CONSTRAINT indicator_indicator_name_key UNIQUE (indicator_name);
ALTER TABLE tag ADD CONSTRAINT tag_tag_name_key UNIQUE (tag_name);
