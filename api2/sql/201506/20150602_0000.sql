-- set the billing ID's for the staging environment
INSERT INTO component (component_name, component_desc) VALUES ('Minutes', 'Used to keep track of the total number of minutes for all calls');

INSERT INTO subscription_component (subscription_id, component_id, component_threshold_max, component_ext_id) VALUES
    ('8', '21', '10000', '2c92c0f94c510a0d014c5bbedc462a22'),
    ('9', '21', '10000', '2c92c0f94cdfb2c5014ce93bb4fa5ea5'),
    ('10', '21', '10000', '2c92c0f94cdfb2c6014ce93eff8b5f15');

UPDATE subscription_component SET component_ext_id='2c92c0f84cdf9966014ce93ae503460b' WHERE subscription_id='8' AND component_id='5';
UPDATE subscription_component SET component_ext_id='2c92c0f94cdfb2c5014ce93bb4da5e9a' WHERE subscription_id='9' AND component_id='5';
UPDATE subscription_component SET component_ext_id='2c92c0f94cdfb2c6014ce93eff6d5f09' WHERE subscription_id='10' AND component_id='5';

UPDATE subscription_component SET component_ext_id='2c92c0f84cdf9966014ce935115037c8' WHERE subscription_id='8' AND component_id='18';
UPDATE subscription_component SET component_ext_id='2c92c0f94cdfb2c5014ce93bb4ab5e96' WHERE subscription_id='9' AND component_id='18';
UPDATE subscription_component SET component_ext_id='2c92c0f94cdfb2c6014ce93eff385f03' WHERE subscription_id='10' AND component_id='18';

UPDATE subscription_component SET component_threshold_max=0 WHERE subscription_id='8' AND component_id='4';
UPDATE subscription_component SET component_threshold_max=0 WHERE subscription_id='9' AND component_id='4';
UPDATE subscription_component SET component_threshold_max=0 WHERE subscription_id='10' AND component_id='4';

DELETE FROM org_component_count WHERE component_id=8;
DELETE FROM org_component_count WHERE component_id=10;

-- create minutes count record for top level OUs
INSERT INTO org_component_count (org_unit_id, component_id) (SELECT org_unit_id, '21' AS component_id FROM org_unit WHERE org_unit_parent_id IS NULL);
-- create minutes count for second level OUs
INSERT INTO org_component_count (org_unit_id, component_id)
    (SELECT org_unit_id, '21' AS component_id FROM org_unit WHERE org_unit_parent_id IN
         (SELECT org_unit_id FROM org_unit WHERE org_unit_parent_id IS NULL)
    );
-- create minutes count for third level OUs
INSERT INTO org_component_count (org_unit_id, component_id)
    (SELECT org_unit_id, '21' AS component_id FROM org_unit WHERE org_unit_parent_id IN
         (SELECT org_unit_id FROM org_unit WHERE org_unit_parent_id IN
              (SELECT org_unit_id FROM org_unit WHERE org_unit_parent_id IS NULL)
         )
    );

UPDATE subscription SET subscription_external_id='2c92c0f94c510a01014c5bbeda8a7233' WHERE subscription_id='8';
UPDATE subscription SET subscription_external_id='2c92c0f94cdfb2c5014ce93bb3435e94' WHERE subscription_id='9';
UPDATE subscription SET subscription_external_id='2c92c0f94cdfb2c6014ce93efec85efb' WHERE subscription_id='10';