-- log table for integrations
CREATE TABLE log_integration (
    log_integration_id                      BIGSERIAL NOT NULL,
    ct_user_id                              INT DEFAULT NULL REFERENCES ct_user (ct_user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    org_unit_id                             INT DEFAULT NULL REFERENCES org_unit (org_unit_id) ON DELETE CASCADE ON UPDATE CASCADE,
    log_date                                TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    log_data                                JSON NOT NULL,
    PRIMARY KEY (log_integration_id)
);
CREATE INDEX log_integration_org_unit_id_idx ON log_integration (org_unit_id);
CREATE INDEX log_integration_log_date_idx ON log_integration (log_date);

CREATE RULE get_pkey_on_insert AS ON INSERT TO org_doubleclick DO SELECT currval('org_doubleclick_doubleclick_id_seq'::text) AS doubleclick_id;
CREATE RULE get_pkey_on_insert AS ON INSERT TO org_dc_map DO SELECT currval('org_dc_map_dc_map_id_seq'::text) AS dc_map_id;

CREATE INDEX call_call_id_idx ON call (call_id);

ALTER TABLE org_dc_map RENAME double_click_id TO doubleclick_id;

CREATE TABLE doubleclick_mapping (
    map_id                              SERIAL NOT NULL,
    metric_display                      VARCHAR(64) NOT NULL,
    metric_pcp_var                      VARCHAR(64),
    indicator_id                        INT DEFAULT NULL REFERENCES indicator (indicator_id) ON DELETE CASCADE ON UPDATE CASCADE,
    map_type                            dc_map_type NOT NULL DEFAULT 'dimension',
    PRIMARY KEY (map_id)
);

INSERT INTO doubleclick_mapping(metric_display, metric_pcp_var, indicator_id, map_type) VALUES
    ('Duration', 'data[:duration]', NULL, 'metric'),
    ('Lead Score', NULL, 22, 'metric'),
    ('Repeat Call', 'repeat_call', NULL, 'dimension'),
    ('Disposition', 'data[:disposition]', NULL, 'dimension'),
    ('State', '@dni_logs["data"][0]["data"]["location_details"]["region_name"]', NULL, 'dimension'),
    ('City', '@dni_logs["data"][0]["data"]["location_details"]["city"]', NULL, 'dimension'),
    ('Referring Type', '@dni_logs["data"][0]["data"]["referring_type"]', NULL, 'dimension'),
    ('Appointment Set', NULL, 1, 'dimension'),
    ('Commitment to Buy', NULL, 2, 'dimension'),
    ('Initial Purchase', NULL, 3, 'dimension'),
    ('Payment Language', NULL, 4, 'dimension'),
    ('Request for Info', NULL, 5, 'dimension'),
    ('Reservation Made', NULL, 6, 'dimension'),
    ('Set Phone Appointment', NULL, 7, 'dimension'),
    ('All Conversion', NULL, 8, 'dimension'),
    ('Missed Opportunity', NULL, 38, 'dimension'),
    ('Sales Inquiry', NULL, 28, 'dimension'),
    ('Existing Customer', NULL, 29, 'dimension');

ALTER TABLE org_dc_map ADD COLUMN map_id INT DEFAULT NULL REFERENCES doubleclick_mapping (map_id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE org_dc_map DROP COLUMN metric_field;
ALTER TABLE org_dc_map DROP COLUMN indicator_id;
ALTER TABLE org_dc_map DROP COLUMN map_type;

INSERT INTO component (component_name, component_desc) VALUES ('Conversation Analytics', 'Call processed through the speech engine for scoring');
-- 19
INSERT INTO scope (scope_code, scope_display, scope_desc) VALUES ('ca', 'Conversation Analytics', 'Process calls through call engine');
-- 25
INSERT INTO component_access (component_id, scope_id, component_permission) VALUES ('19', '25', '7');

INSERT INTO subscription_component (subscription_id, component_id) VALUES ('5', '19'), ('6', '19'), ('7', '19');

INSERT INTO role_access (role_id, scope_id, component_id, permission) VALUES ('1', '25', '19', '7');

INSERT INTO scope (scope_code, scope_display, scope_desc) VALUES ('menu', 'Navigation Menu', 'Control access to menu components');
INSERT INTO component (component_name, component_desc) VALUES ('Admin GUI Tool', 'Administration of account through secure web site');
INSERT INTO component_access (component_id, scope_id, component_permission) VALUES ('20', '26', '7');
INSERT INTO subscription_component (subscription_id, component_id) VALUES ('5', '20'), ('6', '20'), ('7', '20');
INSERT INTO role_access (role_id, scope_id, component_id, permission) VALUES ('1', '26', '20', '7'), ('2', '26', '20', '4');

