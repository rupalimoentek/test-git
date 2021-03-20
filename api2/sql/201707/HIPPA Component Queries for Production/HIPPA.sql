INSERT INTO subscription (subscription_id, subscription_name, subscription_desc, subscription_external_id) VALUES (26, 'Standard Plus','Standard with HIPAA compliance','2c92c0f85d4e95ae015d56b6282273fa');

INSERT INTO component (component_name, component_desc) VALUES ('HIPAA compliance','HIPAA privacy');

INSERT INTO subscription_component (subscription_id, component_id, component_quantity, component_threshold_max) VALUES (26, 1, 1, 0);

INSERT INTO subscription_component (subscription_id, component_id, component_quantity, component_threshold_max) VALUES (26, 4, 1, 0);

INSERT INTO subscription_component (subscription_id, component_id, component_quantity, component_threshold_max) VALUES (26, 6, 1, 0);

INSERT INTO subscription_component (subscription_id, component_id, component_quantity, component_threshold_max) VALUES (26, 7, 1, 0);

INSERT INTO subscription_component (subscription_id, component_id, component_quantity, component_threshold_max) VALUES (26, 8, 1, 0);

INSERT INTO subscription_component (subscription_id, component_id, component_quantity, component_threshold_max) VALUES (26, 9, 1, 0);

INSERT INTO subscription_component (subscription_id, component_id, component_quantity, component_threshold_max) VALUES (26, 11, 1, 0);

INSERT INTO subscription_component (subscription_id, component_id, component_quantity, component_threshold_max) VALUES (26, 12, 1, 0);

INSERT INTO subscription_component (subscription_id, component_id, component_quantity, component_threshold_max) VALUES (26, 13, 1, 0);

INSERT INTO subscription_component (subscription_id, component_id, component_quantity, component_threshold_max) VALUES (26, 14, 1, 0);

INSERT INTO subscription_component (subscription_id, component_id, component_quantity, component_threshold_max) VALUES (26, 15, 1, 0);

INSERT INTO subscription_component (subscription_id, component_id, component_quantity, component_threshold_max) VALUES (26, 16, 1, 0);

INSERT INTO subscription_component (subscription_id, component_id, component_quantity, component_threshold_max) VALUES (26, 17, 1, 0);

INSERT INTO subscription_component (subscription_id, component_id, component_quantity, component_threshold_max) VALUES (26, 20, 1, 0);

INSERT INTO subscription_component (subscription_id, component_id, component_quantity, component_threshold_max) VALUES (26, 23, 1, 0);

INSERT INTO subscription_component (subscription_id, component_id, component_quantity, component_threshold_max) VALUES (26, 24, 1, 0);

INSERT INTO subscription_component (subscription_id, component_id, component_quantity, component_threshold_max) VALUES (26, 2, 1, 99999999);

INSERT INTO subscription_component (subscription_id, component_id, component_quantity, component_threshold_max) VALUES (26, 3, 1, 99999999);

INSERT INTO subscription_component (subscription_id, component_id, component_quantity, component_threshold_max) VALUES (26, 10, 1, 9999999);

INSERT INTO subscription_component (subscription_id, component_id, component_quantity, component_threshold_max) VALUES (26, 27, 1, 0);

INSERT INTO subscription_component (subscription_id, component_id, component_quantity, component_threshold_max, component_ext_id) VALUES (26, 18, 1, 3000, '2c92c0f85d4e95ae015d56b62886740d');

INSERT INTO subscription_component (subscription_id, component_id, component_quantity, component_threshold_max, component_ext_id) VALUES (26, 21, 1, 10000, '2c92c0f85d4e95ae015d56b628687404');

INSERT INTO subscription_component (subscription_id, component_id, component_quantity, component_threshold_max) VALUES (26, 22, 1, 500);

INSERT INTO subscription_component (subscription_id, component_id, component_quantity, component_threshold_max, component_ext_id) VALUES (26, 5, 1, 10000, '2c92c0f85d4e954f015d56c39dbc73b9');

INSERT INTO subscription_component (subscription_id, component_id, component_quantity, component_threshold_max) VALUES (26, 72 ,1,0);

INSERT into scope (scope_id, scope_code, scope_display, scope_desc) VALUES (33, 'hipaa', 'HIPAA compliance', 'HIPAA privacy');

INSERT into component_access (component_id, scope_id) Values (72,33);
INSERT into role_access (role_id, scope_id, component_id, permission) VALUES (1,33,72,7),(2,33,72,7),(5,33,72,7),(6,33,72,7);
