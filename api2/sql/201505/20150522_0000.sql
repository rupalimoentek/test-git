-- drop billing_node and add billing_id
ALTER TABLE org_unit DROP COLUMN billing_node;
ALTER TABLE org_unit ADD COLUMN billing_id INT DEFAULT NULL REFERENCES org_unit (org_unit_id) ON DELETE CASCADE ON UPDATE CASCADE;

-- update all first level child OU's
UPDATE org_unit SET billing_id=org_unit_parent_id WHERE org_unit_parent_id IN (SELECT org_unit_id FROM org_unit WHERE org_unit_parent_id IS NULL);

-- create user count for third level OUs
UPDATE org_unit SET billing_id=top_ou_id WHERE org_unit_parent_id IS NOT NULL AND org_unit_parent_id NOT IN (SELECT org_unit_id FROM org_unit WHERE org_unit_parent_id IS NULL);

UPDATE component SET component_name='Calls' WHERE component_id=5;
INSERT INTO subscription_component (subscription_id, component_id, component_threshold_max) VALUES
    ('8', '5', '99999999'),
    ('9', '5', '99999999'),
    ('10', '5', '99999999');

-- create calls count record for top level OUs
INSERT INTO org_component_count (org_unit_id, component_id) (SELECT org_unit_id, '5' AS component_id FROM org_unit WHERE org_unit_parent_id IS NULL);
-- create calls count for second level OUs
INSERT INTO org_component_count (org_unit_id, component_id)
    (SELECT org_unit_id, '5' AS component_id FROM org_unit WHERE org_unit_parent_id IN
         (SELECT org_unit_id FROM org_unit WHERE org_unit_parent_id IS NULL)
    );
-- create calls count for third level OUs
INSERT INTO org_component_count (org_unit_id, component_id)
    (SELECT org_unit_id, '5' AS component_id FROM org_unit  WHERE org_unit_parent_id IN
         (SELECT org_unit_id FROM org_unit WHERE org_unit_parent_id IN
              (SELECT org_unit_id FROM org_unit WHERE org_unit_parent_id IS NULL)
         )
    );

