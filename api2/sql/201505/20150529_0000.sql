-- adjust subscription component records
-- adjust count on calls
UPDATE subscription_component SET component_threshold_max=10000 WHERE subscription_id=10 AND component_id=5;
UPDATE subscription_component SET component_threshold_max=10000 WHERE subscription_id=9 AND component_id=5;
UPDATE subscription_component SET component_threshold_max=10000 WHERE subscription_id=8 AND component_id=5;

-- remove count on call flows
UPDATE subscription_component SET component_threshold_max=0 WHERE subscription_id=10 AND component_id=8;
UPDATE subscription_component SET component_threshold_max=0 WHERE subscription_id=9 AND component_id=8;
UPDATE subscription_component SET component_threshold_max=0 WHERE subscription_id=8 AND component_id=8;

-- remove count on call actions
UPDATE subscription_component SET component_threshold_max=0 WHERE subscription_id=10 AND component_id=10;
UPDATE subscription_component SET component_threshold_max=0 WHERE subscription_id=9 AND component_id=10;
UPDATE subscription_component SET component_threshold_max=0 WHERE subscription_id=8 AND component_id=10;

UPDATE org_unit SET billing_id=org_unit_id WHERE top_ou_id=org_unit_id;