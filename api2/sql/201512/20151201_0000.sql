INSERT INTO subscription_component (subscription_id, component_id) VALUES ('10', '25');

-- new subscription plan for production
INSERT INTO subscription (subscription_name, subscription_external_id) VALUES ('Multi Client', '2c92a0f84f7344cf014f856b262b097a');
-- billable/countable components
INSERT INTO subscription_component (subscription_id, component_id, component_threshold_max, component_ext_id) VALUES
    ('12', '5', '9999999', '2c92a0f84f7344cf014f856b26980981'),
    ('12', '18', '9999999', '2c92a0f84f7344cf014f856b26e3098c'),
    ('12', '21', '9999999', '2c92a0f84f7344cf014f856b2659097d'),
    ('12', '22', '9999999', '2c92a0f84f7344cf014f856b274e0990'),
    ('12', '2', '9999999', NULL), ('12', '3', '9999999', NULL), ('12', '10', '9999999', NULL);
-- components for features included
INSERT INTO subscription_component (subscription_id, component_id) VALUES
    ('12', '1'), ('12', '4'), ('12', '6'), ('12', '7'), ('12', '8'), ('12', '9'), ('12', '11'), ('12', '12'), ('12', '13'),
    ('12', '14'), ('12', '15'), ('12', '16'), ('12', '17'), ('12', '19'), ('12', '20'), ('12', '23'), ('12', '24'), ('12', '25');

-- same subscription for staging
--INSERT INTO subscription (subscription_name, subscription_external_id) VALUES ('Multi Client', '2c92c0f950cc09fc0150d057b3ec3974');
--INSERT INTO subscription_component (subscription_id, component_id, component_threshold_max, component_ext_id) VALUES
--    ('12', '5', '9999999', '2c92c0f850cbe7f00150d05ceb5b3a46'),
--    ('12', '18', '9999999', '2c92c0f950cc09fc0150d05a7d6c43ee'),
--    ('12', '21', '9999999', '2c92c0f850cbe7eb0150d0594c41292c'),
--    ('12', '22', '9999999', '2c92c0f950cc09fc0150d05dfa2051e5'),
--    ('12', '2', '9999999', NULL), ('12', '3', '9999999', NULL), ('12', '10', '9999999', NULL);

