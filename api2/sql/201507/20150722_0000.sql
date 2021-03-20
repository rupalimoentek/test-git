-- add count to call_action component
UPDATE subscription_component SET component_threshold_max=9999999 WHERE subscription_id=10 AND component_id=10;
UPDATE subscription_component SET component_threshold_max=9999999 WHERE subscription_id=9 AND component_id=10;

INSERT INTO org_component_count (org_unit_id, component_id)
    (SELECT org_unit_id, '10' AS component_id FROM org_account WHERE subscription_id=10 OR subscription_id=9);
