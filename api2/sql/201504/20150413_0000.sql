-- modify webhook and call actions tables
CREATE TABLE webhook_field (
    field_id                    SERIAL NOT NULL,
    parent_field_id             INT DEFAULT NULL REFERENCES webhook_field (field_id) ON DELETE SET NULL ON UPDATE CASCADE,
    display_name                VARCHAR(64) NOT NULL,
    column_name                 VARCHAR(128) DEFAULT NULL,
    table_name                  VARCHAR(128) DEFAULT NULL,
    db_name                     VARCHAR(32) DEFAULT 'ct_prod',
    field_order                 SMALLINT NOT NULL DEFAULT 1,
    field_group                 VARCHAR(64),
    PRIMARY KEY (field_id)
);

DELETE FROM webhook;
ALTER TABLE webhook DROP COLUMN trigger_id;
ALTER TABLE webhook_map DROP COLUMN parent_map_id;
ALTER TABLE webhook_map ADD CONSTRAINT field_enforcement_chk CHECK ((field_id IS NOT NULL AND field_name IS NULL) OR (field_id IS NULL AND field_name IS NOT NULL));
ALTER TABLE webhook_map DROP CONSTRAINT webhook_map_field_id_fkey;
ALTER TABLE webhook_map ADD CONSTRAINT webhook_map_field_id_fkey FOREIGN KEY (field_id) REFERENCES webhook_field (field_id) ON DELETE CASCADE ON UPDATE CASCADE;

DROP TABLE webhook_rule;
DROP TABLE trigger_rule;
DROP TABLE trigger_field;
DROP TABLE trigger;

ALTER TABLE provisioned_route DROP COLUMN product_id;
ALTER TABLE provisioned_route DROP COLUMN provider_id;
ALTER TABLE provisioned_route DROP COLUMN mine;

INSERT INTO webhook_field (display_name, column_name, table_name, db_name, field_order, field_group) VALUES
    ('Call Mine Status', 'call_mine_status', 'call', 'ct_prod', '10', 'Call Details'),
    ('CDR Source', 'cdr_source', 'call_detail', 'ct_prod', '20', 'Call Details'),
    ('Tracking Number', 'tracking', 'call', 'ct_prod', '30', 'Call Details'),
    ('Disposition', 'disposition', 'call', 'ct_prod', '40', 'Call Details'),
    ('Duration', 'duration', 'call', 'ct_prod', '50', 'Call Details'),
    ('Call External ID', 'external_id', 'call_detail', 'ct_prod', '60', 'Call Details'),
    ('Call ID', 'call_id', '', 'ct_prod', '70', 'Call Details'),
    ('Outbound Call', 'is_outbound', 'call_detail', 'ct_prod', '80', 'Call Details'),
    ('Group ID', 'org_unit_id', 'call', 'ct_prod', '90', 'Call Details'),
    ('Repeat Call', 'repeat_call', 'call', 'ct_prod', '100', 'Call Details'),
    ('Source', 'source', 'call', 'ct_prod', '110', 'Call Details'),
    ('Call Started', 'call_started', 'call', 'ct_prod', '120', 'Call Details'),
    ('Ring To Number', 'ring_to', 'call', 'ct_prod', '130', 'Call Details'),
    ('Call Value', 'call_value', 'call_detail', 'ct_prod', '140', 'Call Details'),
    ('Call Recording Filename', 'call_flow_recording_filename', '', 'ct_prod', '150', 'Call Details'),
    ('Indicators', NULL, 'indicator', 'ct_prod', '160', 'Call Details');

INSERT INTO webhook_field (parent_field_id, display_name, column_name, table_name, db_name, field_order, field_group) VALUES
    ('16', 'Score Name', 'indicator_name', 'indicator', 'ct_prod', '170', 'Call Details'),
    ('16', 'Score Value', 'score_value', 'indicator_score', 'ct_prod', '180', 'Call Details');

INSERT INTO webhook_field (display_name, column_name, table_name, db_name, field_order, field_group) VALUES
    ('Group ID', 'org_unit_id ', 'org_unit', 'ct_prod', '190', 'Group Details'),
    ('Parent Group ID', 'org_unit_parent_id', 'org_unit', 'ct_prod', '290', 'Group Details'),
    ('Billing Group ID', 'top_ou_id', 'org_unit', 'ct_prod', '210', 'Group Details'),
    ('External Group ID', 'org_unit_ext_id', 'ct_prod', 'org_unit', '220', 'Group Details'),
    ('Group Name', 'org_unit_name', 'org_unit', 'ct_prod', '230', 'Group Details'),
    ('Address', 'address', 'org_unit_detail', 'ct_prod', '240', 'Group Details'),
    ('City', 'city', 'org_unit_detail', 'ct_prod', '250', 'Group Details'),
    ('State', 'state', 'org_unit_detail', 'ct_prod', '260', 'Group Details'),
    ('Zip', 'zip', 'org_unit_detail', 'ct_prod', '270', 'Group Details'),
    ('Phone Number', 'phone_number', 'org_unit_detail', 'ct_prod', '280', 'Group Details'),
    ('Industry ID', 'industry_id', 'org_unit_detail', 'ct_prod', '290', 'Group Details'),
    ('Date Created', 'org_unit_created', 'org_unit_detail', 'ct_prod', '300', 'Group Details'),
    ('Date Modified', 'org_unit_modified', 'org_unit_detail', 'ct_prod', '310', 'Group Details'),
    ('Group Status', 'org_unit_status', 'org_unit', 'ct_prod', '320', 'Group Details');

INSERT INTO webhook_field (display_name, column_name, table_name, db_name, field_order, field_group) VALUES
    ('Route Name', 'provisioned_route_name', 'provisioned_route', 'ct_prod', '340', 'Route Details'),
    ('Route ID', 'provisioned_route_id', 'provisioned_route', 'ct_prod', '350', 'Route Details'),
    ('Phone Number Pool ID', 'phone_number_pool_id', '', 'ct_prod', '360', 'Route Details'),
    ('Route Type', 'route_type', 'provisioned_route', 'ct_prod', '370', 'Route Details'),
    ('Route Group ID', 'provisioned_route_ou_id', 'provisioned_route', 'ct_prod', '380', 'Route Details'),
    ('Ring To Number', 'default_ringto', 'call_flows', 'callengine', '390', 'Route Details'),
    ('Whisper Enabled', 'whisper_enabled', 'call_flows', 'callengine', '400', 'Route Details'),
    ('Whisper Message', 'whisper_message', 'call_flows', 'callengine', '410', 'Route Details'),
    ('Notify E-mail', 'email_to_notify', 'call_flows', 'callengine', '420', 'Route Details'),
    ('Repeat Interval', 'repeat_interval', 'provisioned_route', 'ct_prod', '430', 'Route Details'),
    ('Call Value', 'call_value', 'provisioned_route', 'ct_prod', '440', 'Route Details'),
    ('Description', 'description', 'provisioned_route', 'ct_prod', '450', 'Route Details'),
    ('Route Status', 'provisioned_route_status', 'provisioned_route', 'ct_prod', '460', 'Route Details'),
    ('Route Created', 'provisioned_route_created', 'provisioned_route', 'ct_prod', '470', 'Route Details'),
    ('Route Modified', 'provisioned_route_modified', 'provisioned_route', 'ct_prod', '480', 'Route Details'),
    ('Play Disclaimer', 'play_disclaimer', 'provisioned_route', 'ct_prod', '490', 'Route Details');



