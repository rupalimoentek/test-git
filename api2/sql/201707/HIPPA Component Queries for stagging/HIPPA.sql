INSERT into scope (scope_id, scope_code, scope_display, scope_desc) VALUES (33, 'hipaa', 'HIPAA compliance', 'HIPAA privacy');
INSERT into component_access (component_id, scope_id) Values (843,33);
INSERT into role_access (role_id, scope_id, component_id, permission) VALUES (1,33,843,7),(2,33,843,7),(5,33,843,7),(6,33,843,7)

INSERT INTO subscription (subscription_id, subscription_name, subscription_desc, subscription_external_id) VALUES ('15', 'Standard Plus','Standard with HIPAA compliance','2c92c0f85d4e95ae015d56b6282273fa');

INSERT INTO component (component_name, component_desc) VALUES ('HIPAA compliance','HIPAA privacy');

INSERT INTO subscription_component (subscription_id, component_id, component_quantity, component_threshold_max) VALUES (15, 1, 1, 0);

INSERT INTO subscription_component (subscription_id, component_id, component_quantity, component_threshold_max) VALUES (15, 4, 1, 0);

INSERT INTO subscription_component (subscription_id, component_id, component_quantity, component_threshold_max) VALUES (15, 6, 1, 0);

INSERT INTO subscription_component (subscription_id, component_id, component_quantity, component_threshold_max) VALUES (15, 7, 1, 0);

INSERT INTO subscription_component (subscription_id, component_id, component_quantity, component_threshold_max) VALUES (15, 8, 1, 0);

INSERT INTO subscription_component (subscription_id, component_id, component_quantity, component_threshold_max) VALUES (15, 9, 1, 0);

INSERT INTO subscription_component (subscription_id, component_id, component_quantity, component_threshold_max) VALUES (15, 11, 1, 0);

INSERT INTO subscription_component (subscription_id, component_id, component_quantity, component_threshold_max) VALUES (15, 12, 1, 0);

INSERT INTO subscription_component (subscription_id, component_id, component_quantity, component_threshold_max) VALUES (15, 13, 1, 0);

INSERT INTO subscription_component (subscription_id, component_id, component_quantity, component_threshold_max) VALUES (15, 14, 1, 0);

INSERT INTO subscription_component (subscription_id, component_id, component_quantity, component_threshold_max) VALUES (15, 15, 1, 0);

INSERT INTO subscription_component (subscription_id, component_id, component_quantity, component_threshold_max) VALUES (15, 16, 1, 0);

INSERT INTO subscription_component (subscription_id, component_id, component_quantity, component_threshold_max) VALUES (15, 17, 1, 0);

INSERT INTO subscription_component (subscription_id, component_id, component_quantity, component_threshold_max) VALUES (15, 20, 1, 0);

INSERT INTO subscription_component (subscription_id, component_id, component_quantity, component_threshold_max) VALUES (15, 23, 1, 0);

INSERT INTO subscription_component (subscription_id, component_id, component_quantity, component_threshold_max) VALUES (15, 24, 1, 0);

INSERT INTO subscription_component (subscription_id, component_id, component_quantity, component_threshold_max) VALUES (15, 2, 1, 99999999);

INSERT INTO subscription_component (subscription_id, component_id, component_quantity, component_threshold_max) VALUES (15, 3, 1, 99999999);

INSERT INTO subscription_component (subscription_id, component_id, component_quantity, component_threshold_max) VALUES (15, 10, 1, 9999999);

INSERT INTO subscription_component (subscription_id, component_id, component_quantity, component_threshold_max) VALUES (15, 27, 1, 0);

INSERT INTO subscription_component (subscription_id, component_id, component_quantity, component_threshold_max, component_ext_id) VALUES (15, 18, 1, 3000, '2c92c0f85d4e95ae015d56b62886740d');

INSERT INTO subscription_component (subscription_id, component_id, component_quantity, component_threshold_max, component_ext_id) VALUES (15, 21, 1, 10000, '2c92c0f85d4e95ae015d56b628687404');

INSERT INTO subscription_component (subscription_id, component_id, component_quantity, component_threshold_max) VALUES (15, 22, 1, 500);

INSERT INTO subscription_component (subscription_id, component_id, component_quantity, component_threshold_max, component_ext_id) VALUES (15, 5, 1, 10000, '2c92c0f85d4e954f015d56c39dbc73b9');
INSERT INTO subscription_component (subscription_id, component_id, component_quantity, component_threshold_max) VALUES (15, 843 ,1,0);
