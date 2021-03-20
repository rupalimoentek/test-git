-- Add subscription plans
INSERT INTO subscription (subscription_name, subscription_desc, subscription_external_id) VALUES
    ('Starter', 'Basic call analytics with aggressive minute/number pricing for a no frills minutes and numbers user', '123'),
    ('Engager', 'Advanced call analytics for the traditional call tracking customer who values rich data from before during and after the call', '345'),
    ('Dominator', 'Complete call marketing optimization for the sophisticated digital advertiser who uses call analytics and automation to optimize call marketing campaigns', '745');

INSERT INTO subscription_component (subscription_id, component_id, component_threshold_max, component_quantity) VALUES
    ('8', '1', 0, 1),
    ('8', '2', 0, 1),
    ('8', '3', 0, 1),
    ('8', '6', 0, 1),
    ('8', '7', 10000, 1),
    ('8', '9', 0, 1),
    ('8', '12', 0, 1),
    ('8', '16', 0, 1),
    ('8', '8', 0, 1),
    ('8', '18', 3000, 1),
    ('8', '20', 0, 1);
INSERT INTO subscription_component (subscription_id, component_id, component_threshold_max, component_quantity) VALUES
    ('9', '1', 0, 1),
    ('9', '2', 0, 1),
    ('9', '3', 0, 1),
    ('9', '6', 0, 1),
    ('9', '7', 0, 1),
    ('9', '8', 10000, 1),
    ('9', '9', 0, 1),
    ('9', '10', 0, 1),
    ('9', '11', 0, 1),
    ('9', '12', 0, 1),
    ('9', '13', 0, 1),
    ('9', '16', 0, 1),
    ('9', '18', 3000, 1),
    ('9', '19', 0, 1),
    ('9', '20', 0, 1);
INSERT INTO subscription_component (subscription_id, component_id, component_threshold_max, component_quantity) VALUES
    ('10', '1', 0, 1),
    ('10', '2', 0, 1),
    ('10', '3', 0, 1),
    ('10', '6', 0, 1),
    ('10', '7', 10000, 1),
    ('10', '8', 0, 1),
    ('10', '9', 0, 1),
    ('10', '10', 0, 1),
    ('10', '11', 0, 1),
    ('10', '12', 0, 1),
    ('10', '13', 3000, 1),
    ('10', '14', 0, 1),
    ('10', '15', 0, 1),
    ('10', '16', 0, 1),
    ('10', '17', 0, 1),
    ('10', '18', 0, 1),
    ('10', '19', 0, 1),
    ('10', '20', 0, 1);

UPDATE component SET component_desc='Track and keep count of calls processed' WHERE component_id='4';
ALTER TABLE subscription_component ALTER COLUMN component_threshold_max SET DATA TYPE int;

INSERT INTO subscription_component (subscription_id, component_id, component_threshold_max, component_quantity) VALUES
    ('8', '4', 999999999, 1),
    ('9', '4', 999999999, 1),
    ('10', '4', 999999999, 1);

UPDATE subscription_component SET component_threshold_max=0 WHERE subscription_id='8' AND component_id='7';
UPDATE subscription_component SET component_threshold_max=0 WHERE subscription_id='9' AND component_id='8';
UPDATE subscription_component SET component_threshold_max=0 WHERE subscription_id='10' AND component_id='7';
UPDATE subscription_component SET component_threshold_max=0 WHERE subscription_id='10' AND component_id='13';
UPDATE subscription_component SET component_threshold_max=3000 WHERE subscription_id='10' AND component_id='18';

INSERT INTO org_component_count (org_unit_id, component_id, count_total) VALUES
    ('76', '4', '0'),
    ('8', '4', '0');

ALTER TABLE subscription_component ADD CONSTRAINT subscription_component_key UNIQUE (subscription_id, component_id);
ALTER TABLE org_account ADD CONSTRAINT org_account_subscription_component_key UNIQUE (org_unit_id, subscription_id, component_id);
