-- linking table between provisioned_routes and call_flow_recording
CREATE TABLE call_flow_route_link (
    prcfr_link_id                   SERIAL NOT NULL,
    provisioned_route_id            INT NOT NULL REFERENCES provisioned_route(provisioned_route_id) ON DELETE CASCADE ON UPDATE CASCADE,
    call_flow_recording_id          INT NOT NULL REFERENCES call_flow_recording(call_flow_recording_id) ON DELETE CASCADE ON UPDATE CASCADE,
    PRIMARY KEY (prcfr_link_id)
);
CREATE INDEX call_flow_route_link_provisioned_route_id_idx ON call_flow_route_link (provisioned_route_id);
CREATE INDEX call_flow_route_link_call_flow_recording_id_idx ON call_flow_route_link (call_flow_recording_id);

ALTER TABLE call_flow_recording ADD COLUMN recording_active BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE log_call_flow (
    log_call_id                             BIGSERIAL NOT NULL,
    call_flow_id                            INT DEFAULT NULL,
    ct_user_id                              INT DEFAULT NULL REFERENCES ct_user (ct_user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    org_unit_id                             INT DEFAULT NULL REFERENCES org_unit (org_unit_id) ON DELETE CASCADE ON UPDATE CASCADE,
    log_date                                TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    log_data                                JSON NOT NULL,
    PRIMARY KEY (log_call_id)
);
CREATE INDEX log_call_flow_call_flow_id_idx ON log_call_flow (call_flow_id);
CREATE INDEX log_call_flow_org_unit_id_idx ON log_call_flow (org_unit_id);
CREATE INDEX log_call_flow_log_date_idx ON log_call_flow (log_date);


CREATE TABLE log_call_action (
    log_action_id                           BIGSERIAL NOT NULL,
    action_id                               INT DEFAULT NULL REFERENCES call_action (action_id) ON DELETE CASCADE ON UPDATE CASCADE,
    ct_user_id                              INT DEFAULT NULL REFERENCES ct_user (ct_user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    org_unit_id                             INT DEFAULT NULL REFERENCES org_unit (org_unit_id) ON DELETE CASCADE ON UPDATE CASCADE,
    log_date                                TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    log_data                                JSON NOT NULL,
    PRIMARY KEY (log_action_id)
);
CREATE INDEX log_call_action_action_id_idx ON log_call_action (action_id);
CREATE INDEX log_call_action_org_unit_id_idx ON log_call_action (org_unit_id);
CREATE INDEX log_call_action_log_date_idx ON log_call_action (log_date);

CREATE TABLE log_webhook (
    log_webhook_id                          BIGSERIAL NOT NULL,
    webhook_id                              INT DEFAULT NULL REFERENCES webhook (webhook_id) ON DELETE CASCADE ON UPDATE CASCADE,
    ct_user_id                              INT DEFAULT NULL REFERENCES ct_user (ct_user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    org_unit_id                             INT DEFAULT NULL REFERENCES org_unit (org_unit_id) ON DELETE CASCADE ON UPDATE CASCADE,
    log_date                                TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    log_data                                JSON NOT NULL,
    PRIMARY KEY (log_webhook_id)
);
CREATE INDEX log_webhook_webhook_id_idx ON log_webhook (webhook_id);
CREATE INDEX log_webhook_org_unit_id_idx ON log_webhook (org_unit_id);
CREATE INDEX log_webhook_log_date_idx ON log_webhook (log_date);

ALTER TABLE trigger ADD COLUMN trigger_repo VARCHAR(64);
ALTER TABLE trigger_field ADD COLUMN field_order SMALLINT;

INSERT INTO trigger (trigger_name, trigger_desc, trigger_repo, trigger_file) VALUES ('Call', 'At the point where a call is recorded into the system', 'pcp', 'app/classes/transcoder.rb');
INSERT INTO trigger (trigger_name, trigger_desc, trigger_repo, trigger_file) VALUES ('Indicator', 'The point where indicator scores have been processed', 'app', 'app/controllers/webhooks_controller.php');

-- ===== trigger 1 (Call) fields ======
INSERT INTO trigger_field (trigger_id, display_name, column_name, table_name, field_group, field_order) VALUES ('1', 'Call ID', 'call_id', 'call', 'Call_Detail', '1');
INSERT INTO trigger_field (trigger_id, display_name, column_name, table_name, field_group, field_order) VALUES ('1', 'Organization Group ID', 'org_unit_id', 'call', 'Call_Detail', '2');
INSERT INTO trigger_field (trigger_id, display_name, column_name, table_name, field_group, field_order) VALUES ('1', 'External Group ID', 'external_id', 'call_detail', 'Call_Detail', '3');
INSERT INTO trigger_field (trigger_id, display_name, column_name, table_name, field_group, field_order) VALUES ('1', 'Call Date/Time', 'call_started', 'call', 'Call_Detail', '4');
INSERT INTO trigger_field (trigger_id, display_name, column_name, table_name, field_group, field_order) VALUES ('1', 'Caller ID', 'source', 'call', 'Call_Detail', '5');
-- INSERT INTO trigger_field (trigger_id, display_name, column_name, table_name, field_group, field_order) VALUES ('1', 'Scorer User ID', '', '', 'Call_Detail', '6');
INSERT INTO trigger_field (trigger_id, display_name, column_name, table_name, field_group, field_order) VALUES ('1', 'Route Name', 'provisioned_route_name', 'provisioned_route', 'Call_Detail', '7');
INSERT INTO trigger_field (trigger_id, display_name, column_name, table_name, field_group, field_order) VALUES ('1', 'Tracking Number', 'tracking', 'call', 'Call_Detail', '8');
INSERT INTO trigger_field (trigger_id, display_name, column_name, table_name, field_group, field_order) VALUES ('1', 'Ring To Number', 'ring_to', 'call', 'Call_Detail', '9');
-- INSERT INTO trigger_field (trigger_id, display_name, column_name, table_name, field_group, field_order) VALUES ('1', 'Type', '', '', 'Call_Detail', '10');
INSERT INTO trigger_field (trigger_id, display_name, column_name, table_name, field_group, field_order) VALUES ('1', 'DNI Source', 'dni_log_id', 'call_detail', 'Call_Detail', '11');
-- INSERT INTO trigger_field (trigger_id, display_name, column_name, table_name, field_group, field_order) VALUES ('1', 'DNI URL', '', '', 'Call_Detail', '12');
INSERT INTO trigger_field (trigger_id, display_name, column_name, table_name, field_group, field_order) VALUES ('1', 'Duration', 'duration', 'call', 'Call_Detail', '13');
INSERT INTO trigger_field (trigger_id, display_name, column_name, table_name, field_group, field_order) VALUES ('1', 'Disposition', 'disposition', 'call', 'Call_Detail', '14');
INSERT INTO trigger_field (trigger_id, display_name, column_name, table_name, field_group, field_order) VALUES ('1', 'Tags', 'tag_name', 'tag', 'Call_Detail', '15');
INSERT INTO trigger_field (trigger_id, display_name, column_name, table_name, field_group, field_order) VALUES ('1', 'Extended Data', 'call_data', 'call_extend', 'Call_Detail', '16');

-- ===== trigger 2 (Indicator) fields ======
INSERT INTO trigger_field (trigger_id, display_name, column_name, table_name, field_group, field_order) VALUES ('2', 'Call ID', 'call_id', 'call', 'Call_Detail', '1');
INSERT INTO trigger_field (trigger_id, display_name, column_name, table_name, field_group, field_order) VALUES ('2', 'Organization Group ID', 'org_unit_id', 'call', 'Call_Detail', '2');
INSERT INTO trigger_field (trigger_id, display_name, column_name, table_name, field_group, field_order) VALUES ('2', 'External Group ID', 'external_id', 'call_detail', 'Call_Detail', '3');
INSERT INTO trigger_field (trigger_id, display_name, column_name, table_name, field_group, field_order) VALUES ('2', 'Call Date/Time', 'call_started', 'call', 'Call_Detail', '4');
INSERT INTO trigger_field (trigger_id, display_name, column_name, table_name, field_group, field_order) VALUES ('2', 'Caller ID', 'source', 'call', 'Call_Detail', '5');
-- INSERT INTO trigger_field (trigger_id, display_name, column_name, table_name, field_group, field_order) VALUES ('2', 'Scorer User ID', '', '', 'Call_Detail', '6');
INSERT INTO trigger_field (trigger_id, display_name, column_name, table_name, field_group, field_order) VALUES ('2', 'Route Name', 'provisioned_route_name', 'provisioned_route', 'Call_Detail', '7');
INSERT INTO trigger_field (trigger_id, display_name, column_name, table_name, field_group, field_order) VALUES ('2', 'Tracking Number', 'tracking', 'call', 'Call_Detail', '8');
INSERT INTO trigger_field (trigger_id, display_name, column_name, table_name, field_group, field_order) VALUES ('2', 'Ring To Number', 'ring_to', 'call', 'Call_Detail', '9');
-- INSERT INTO trigger_field (trigger_id, display_name, column_name, table_name, field_group, field_order) VALUES ('2', 'Type', '', '', 'Call_Detail', '10');
INSERT INTO trigger_field (trigger_id, display_name, column_name, table_name, field_group, field_order) VALUES ('2', 'DNI Source', 'dni_log_id', 'call_detail', 'Call_Detail', '11');
-- INSERT INTO trigger_field (trigger_id, display_name, column_name, table_name, field_group, field_order) VALUES ('2', 'DNI URL', '', '', 'Call_Detail', '12');
INSERT INTO trigger_field (trigger_id, display_name, column_name, table_name, field_group, field_order) VALUES ('2', 'Duration', 'duration', 'call', 'Call_Detail', '13');
INSERT INTO trigger_field (trigger_id, display_name, column_name, table_name, field_group, field_order) VALUES ('2', 'Disposition', 'disposition', 'call', 'Call_Detail', '14');
INSERT INTO trigger_field (trigger_id, display_name, column_name, table_name, field_group, field_order) VALUES ('2', 'Tags', 'tag_name', 'tag', 'Call_Detail', '15');
INSERT INTO trigger_field (trigger_id, display_name, column_name, table_name, field_group, field_order) VALUES ('2', 'Extended Data', 'call_data', 'call_extend', 'Call_Detail', '16');
INSERT INTO trigger_field (trigger_id, display_name, column_name, table_name, field_group, field_order) VALUES ('2', 'Indicator Name', 'indicator_name', 'indicator', 'Indicator', '17');
INSERT INTO trigger_field (trigger_id, display_name, column_name, table_name, field_group, field_order) VALUES ('2', 'Indicator Strength', 'score_value', 'indicator_score', 'Indicator', '18');

CREATE RULE get_pkey_on_insert AS ON INSERT TO webhook_map DO SELECT currval(('webhook_map_webhook_map_id_seq'::text)::regclass) AS webhook_map_id;

