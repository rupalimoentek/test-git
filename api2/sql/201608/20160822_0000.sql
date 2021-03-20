-- phone tier
CREATE TABLE phone_tier (
    tier 				SERIAL NOT NULL,
    tier_name 			VARCHAR(255),
    number_cost  		NUMERIC(6,2) NOT NULL DEFAULT 0.00,
    usage_cost          NUMERIC(6,2) NOT NULL DEFAULT 0.00,
    PRIMARY KEY (tier)
);

INSERT INTO phone_tier (tier, tier_name, number_cost, usage_cost) VALUES
    ('0', 'Lower 48', '0.40', '0.04'),
    ('1', 'Toll Free Number', '1.00', '0.04'),
    ('2', 'Canada', '2.00', '0.09'),
    ('3', 'Hawaii', '1.00', '0.06'),
    ('4', 'Alaska', '1.00', '0.15'),
    ('5', 'Puerto Rico', '2.00', '0.25'),
    ('6', 'Bahamas', '2.00', '0.25'),
    ('40', 'Referral', '10.00', '0.00'),
    ('50', 'True 800', '10.00', '0.06'),
    ('51', 'Repeater', '10.00', '0.06'),
    ('52', 'Double Repeater', '10.00', '0.06'),
    ('53', 'Sequence', '10.00', '0.06'),
    ('99', 'Quote', '0.00', '0.00');

ALTER TABLE phone_detail ADD CONSTRAINT phone_detail_tier_fkey FOREIGN KEY (tier) REFERENCES phone_tier (tier) ON UPDATE CASCADE ON DELETE RESTRICT;

-- new billing component / subscriptions
--INSERT INTO component (component_id, component_name, component_desc) VALUES ('26', 'Minutes per line', 'Static number of minutes per line');

--INSERT INTO subscription (subscription_name, subscription_external_id) VALUES ('Call Tracker', '2c92c0f95239b14e01523c46ef0b7446');
--INSERT INTO subscription (subscription_name, subscription_external_id) VALUES ('Call Tracker Plus', '2c92c0f85239914d01523c40e4bc36f9');

--INSERT INTO subscription_component (subscription_id, component_id, component_threshold_max, component_ext_id) VALUES
--    ('13', '2', '0', null),
--    ('13', '3', '0', null),
--    ('13', '4', '0', null),
--    ('13', '5', '0', null),
--    ('13', '6', '0', null),
--    ('13', '7', '0', null),
--    ('13', '8', '0', null),
--    ('13', '12', '0', null),
--    ('13', '16', '0', null),
--    ('13', '17', '0', null),
--    ('13', '18', '9999999', '2c92c0f85239914d01523c40e53b3704'),
--    ('13', '20', '0', null),
--    ('13', '21', '9999999', '2c92c0f85239914d01523c40e4ea36fb'),
--    ('13', '22', '0', null),
--    ('13', '23', '0', null),
--    ('13', '24', '0', null),
--    ('13', '25', '0', null),
--    ('13', '26', '500', '2c92c0f8569c6c2301569e3f87d14f66');

--INSERT INTO subscription_component (subscription_id, component_id, component_threshold_max, component_ext_id) VALUES
--    ('14', '2', '0', null),
--    ('14', '3', '0', null),
--    ('14', '4', '0', null),
--    ('14', '5', '0', null),
--    ('14', '6', '0', null),
--    ('14', '7', '0', null),
--    ('14', '8', '0', null),
--    ('14', '9', '0', null),
--    ('14', '10', '0', null),
--    ('14', '11', '0', null),
--    ('14', '12', '0', null),
--    ('14', '13', '0', null),
--    ('14', '16', '0', null),
--    ('14', '17', '0', null),
--    ('14', '18', '9999999', '2c92c0f95239b14e01523c46ef8c7458'),
--    ('14', '19', '0', null),
--    ('14', '20', '0', null),
--    ('14', '21', '9999999', '2c92c0f8569c6bcd01569e40ab3b537d'),
--    ('14', '22', '0', null),
--    ('14', '23', '0', null),
--    ('14', '24', '0', null),
--    ('14', '25', '0', null),
--    ('14', '26', '500', '2c92c0f8569c6c2301569e3f87d14f66');

-- phone third party vendor order
ALTER TABLE phone_vendor ADD COLUMN vendor_order SMALLINT DEFAULT NULL;
UPDATE phone_vendor SET vendor_order='1' WHERE vendor_name='Bandwidth';
UPDATE phone_vendor SET vendor_order='2' WHERE vendor_name='Vitelity';

-- new log table for scheduled reports and distribution list
CREATE TABLE log_schedule (
    log_schedule_id                         BIGSERIAL NOT NULL,
    schedule_id                             INT DEFAULT NULL REFERENCES schedule (schedule_id) ON DELETE SET NULL ON UPDATE CASCADE,
    ct_user_id                              INT DEFAULT NULL REFERENCES ct_user (ct_user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    org_unit_id                             INT DEFAULT NULL REFERENCES org_unit (org_unit_id) ON DELETE CASCADE ON UPDATE CASCADE,
    log_date                                TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    log_data                                JSON NOT NULL,
    PRIMARY KEY (log_schedule_id)
);
CREATE INDEX log_schedule_schedule_id_idx ON log_schedule (schedule_id);
CREATE INDEX log_schedule_org_unit_id_idx ON log_schedule (org_unit_id);
CREATE INDEX log_schedule_ct_user_id_idx ON log_schedule (ct_user_id);
CREATE INDEX log_schedule_log_date_idx ON log_schedule (log_date);

GRANT SELECT,UPDATE,DELETE,INSERT ON log_schedule TO interact;
GRANT SELECT,UPDATE ON log_schedule_log_schedule_id_seq TO interact;

