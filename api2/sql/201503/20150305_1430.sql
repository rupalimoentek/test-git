SELECT setval('public.scope_scope_id_seq', (SELECT scope_id FROM scope ORDER BY scope_id DESC LIMIT 1), true);
SELECT setval('public.call_flow_recording_call_flow_recording_id_seq', (SELECT call_flow_recording_id FROM call_flow_recording ORDER BY call_flow_recording_id DESC LIMIT 1), true);
SELECT setval('public.campaign_campaign_id_seq', (SELECT campaign_id FROM campaign ORDER BY campaign_id DESC LIMIT 1), true);
SELECT setval('public.channel_channel_id_seq', (SELECT channel_id FROM channel ORDER BY channel_id DESC LIMIT 1), true);
SELECT setval('public.component_component_id_seq', (SELECT component_id FROM component ORDER BY component_id DESC LIMIT 1), true);
SELECT setval('public.ct_log_ct_log_id_seq', (SELECT ct_log_id FROM ct_log ORDER BY ct_log_id DESC LIMIT 1), true);
SELECT setval('public.ct_user_ct_user_id_seq', (SELECT ct_user_id FROM ct_user ORDER BY ct_user_id DESC LIMIT 1), true);
SELECT setval('public.geo_lookup_id_seq', (SELECT id FROM geo_lookup ORDER BY id DESC LIMIT 1), true);
SELECT setval('public.industry_industry_id_seq', (SELECT industry_id FROM industry ORDER BY industry_id DESC LIMIT 1), true);
SELECT setval('public.org_account_account_id_seq', (SELECT account_id FROM org_account ORDER BY account_id DESC LIMIT 1), true);
SELECT setval('public.org_unit_org_unit_id_seq', (SELECT org_unit_id FROM org_unit ORDER BY org_unit_id DESC LIMIT 1), true);
SELECT setval('public.phone_number_phone_number_id_seq', (SELECT phone_number_id FROM phone_number ORDER BY phone_number_id DESC LIMIT 1), true);
SELECT setval('public.provisioned_route_provisioned_route_id_seq', (SELECT provisioned_route_id FROM provisioned_route ORDER BY provisioned_route_id DESC LIMIT 1), true);
SELECT setval('public.role_access_access_id_seq', (SELECT access_id FROM role_access ORDER BY access_id DESC LIMIT 1), true);
SELECT setval('public.role_role_id_seq', (SELECT role_id FROM role ORDER BY role_id DESC LIMIT 1), true);
SELECT setval('public.subscription_subscription_id_seq', (SELECT subscription_id FROM subscription ORDER BY subscription_id DESC LIMIT 1), true);

UPDATE component SET component_external_id=NULL WHERE component_id=1;
UPDATE component SET component_external_id=NULL WHERE component_id=2;
UPDATE component SET component_external_id=NULL, component_name='Users', component_desc='Individual user account with login capability and associated with a role for an organizational unit' WHERE component_id=3;
UPDATE component SET component_name='Call Flow' WHERE component_id=8;
UPDATE component SET component_name='Dynamic Number Insertion' WHERE component_id=9;

UPDATE scope SET scope_code='googleua' WHERE scope_id=12;
UPDATE scope SET scope_code='user' WHERE scope_id=3;

INSERT INTO scope (scope_code, scope_display) VALUES ('webhook', 'Webhooks');
INSERT INTO scope (scope_code, scope_display) VALUES ('callaction', 'Call Actions');
INSERT INTO scope (scope_code, scope_display) VALUES ('doubleclick', 'DoubleClick Integration');
INSERT INTO scope (scope_code, scope_display) VALUES ('marin', 'Marin');
INSERT INTO scope (scope_code, scope_display) VALUES ('orgunit', 'Organizational Units');
INSERT INTO scope (scope_code, scope_display) VALUES ('callflow', 'Call Flow');
INSERT INTO scope (scope_code, scope_display) VALUES ('number', 'Phone Numbers');
DELETE FROM scope WHERE scope_id=4;
DELETE FROM scope WHERE scope_id=5;
DELETE FROM scope WHERE scope_id=14;
DELETE FROM scope WHERE scope_id=13;
DELETE FROM scope WHERE scope_id=17;
DELETE FROM scope WHERE scope_id=9;
DELETE FROM scope WHERE scope_id=10;
DELETE FROM scope WHERE scope_id=15;

DELETE FROM component WHERE component_id=4;
DELETE FROM component WHERE component_id=5;

INSERT INTO component (component_name) VALUES ('Call Actions');
INSERT INTO component (component_name) VALUES ('Webhooks');
INSERT INTO component (component_name) VALUES ('API');
INSERT INTO component (component_name) VALUES ('Google UA');
INSERT INTO component (component_name) VALUES ('DoubleClick');
INSERT INTO component (component_name) VALUES ('Marin');
INSERT INTO component (component_name) VALUES ('Organizational Units');
INSERT INTO component (component_name, component_desc) VALUES ('Advanced Routing', 'IVR, scheduled routing, GEO routing');
INSERT INTO component (component_name) VALUES ('Numbers');

UPDATE component_access SET component_permission=7 WHERE scope_id <= 10;

INSERT INTO component_access (component_id, scope_id, component_permission) VALUES ('13', '12', '6');
INSERT INTO component_access (component_id, scope_id, component_permission) VALUES ('12', '16', '6');
INSERT INTO component_access (component_id, scope_id, component_permission) VALUES ('11', '18', '6');
INSERT INTO component_access (component_id, scope_id, component_permission) VALUES ('10', '19', '6');
INSERT INTO component_access (component_id, scope_id, component_permission) VALUES ('14', '20', '6');
INSERT INTO component_access (component_id, scope_id, component_permission) VALUES ('15', '21', '6');
INSERT INTO component_access (component_id, scope_id, component_permission) VALUES ('2', '2', '7');
INSERT INTO component_access (component_id, scope_id, component_permission) VALUES ('16', '22', '6');
INSERT INTO component_access (component_id, scope_id, component_permission) VALUES ('8', '23', '7');
INSERT INTO component_access (component_id, scope_id, component_permission) VALUES ('9', '11', '7');
INSERT INTO component_access (component_id, scope_id, component_permission) VALUES ('17', '8', '7');

INSERT INTO subscription_component (subscription_id, component_id) VALUES ('2', '3');
INSERT INTO subscription_component (subscription_id, component_id) VALUES ('3', '3');
INSERT INTO subscription_component (subscription_id, component_id) VALUES ('4', '3');

INSERT INTO subscription (subscription_name, subscription_external_id) VALUES ('Bengal', '432');
INSERT INTO subscription (subscription_name, subscription_external_id) VALUES ('Siberian', '433');
INSERT INTO subscription (subscription_name, subscription_external_id) VALUES ('Malayan', '434');

INSERT INTO subscription_component (subscription_id, component_id) VALUES ('5', '1');
INSERT INTO subscription_component (subscription_id, component_id) VALUES ('5', '2');
INSERT INTO subscription_component (subscription_id, component_id) VALUES ('5', '3');
INSERT INTO subscription_component (subscription_id, component_id) VALUES ('5', '6');
INSERT INTO subscription_component (subscription_id, component_id) VALUES ('5', '7');
INSERT INTO subscription_component (subscription_id, component_id) VALUES ('5', '12');
INSERT INTO subscription_component (subscription_id, component_id) VALUES ('5', '16');
INSERT INTO subscription_component (subscription_id, component_id) VALUES ('5', '8');
INSERT INTO subscription_component (subscription_id, component_id) VALUES ('5', '9');
INSERT INTO subscription_component (subscription_id, component_id) VALUES ('5', '17');
INSERT INTO subscription_component (subscription_id, component_id) VALUES ('5', '18');

INSERT INTO subscription_component (subscription_id, component_id) VALUES ('6', '1');
INSERT INTO subscription_component (subscription_id, component_id) VALUES ('6', '2');
INSERT INTO subscription_component (subscription_id, component_id) VALUES ('6', '3');
INSERT INTO subscription_component (subscription_id, component_id) VALUES ('6', '6');
INSERT INTO subscription_component (subscription_id, component_id) VALUES ('6', '7');
INSERT INTO subscription_component (subscription_id, component_id, component_threshold_max) VALUES ('6', '10', '10000');
INSERT INTO subscription_component (subscription_id, component_id) VALUES ('6', '11');
INSERT INTO subscription_component (subscription_id, component_id) VALUES ('6', '12');
INSERT INTO subscription_component (subscription_id, component_id) VALUES ('6', '13');
INSERT INTO subscription_component (subscription_id, component_id) VALUES ('6', '15');
INSERT INTO subscription_component (subscription_id, component_id) VALUES ('6', '16');
INSERT INTO subscription_component (subscription_id, component_id) VALUES ('6', '9');
INSERT INTO subscription_component (subscription_id, component_id) VALUES ('6', '8');
INSERT INTO subscription_component (subscription_id, component_id) VALUES ('6', '17');
INSERT INTO subscription_component (subscription_id, component_id) VALUES ('6', '18');

INSERT INTO subscription_component (subscription_id, component_id) VALUES ('7', '1');
INSERT INTO subscription_component (subscription_id, component_id) VALUES ('7', '2');
INSERT INTO subscription_component (subscription_id, component_id) VALUES ('7', '3');
INSERT INTO subscription_component (subscription_id, component_id) VALUES ('7', '6');
INSERT INTO subscription_component (subscription_id, component_id) VALUES ('7', '7');
INSERT INTO subscription_component (subscription_id, component_id) VALUES ('7', '10');
INSERT INTO subscription_component (subscription_id, component_id) VALUES ('7', '11');
INSERT INTO subscription_component (subscription_id, component_id) VALUES ('7', '12');
INSERT INTO subscription_component (subscription_id, component_id) VALUES ('7', '13');
INSERT INTO subscription_component (subscription_id, component_id) VALUES ('7', '14');
INSERT INTO subscription_component (subscription_id, component_id) VALUES ('7', '15');
INSERT INTO subscription_component (subscription_id, component_id) VALUES ('7', '16');
INSERT INTO subscription_component (subscription_id, component_id) VALUES ('7', '17');
INSERT INTO subscription_component (subscription_id, component_id) VALUES ('7', '18');
INSERT INTO subscription_component (subscription_id, component_id) VALUES ('7', '9');
INSERT INTO subscription_component (subscription_id, component_id) VALUES ('7', '8');

UPDATE role_access SET permission=7 WHERE access_id=1;
UPDATE role_access SET permission=7 WHERE access_id=2;
UPDATE role_access SET permission=7 WHERE access_id=7;
UPDATE role_access SET permission=7 WHERE access_id=10;
UPDATE role_access SET permission=7 WHERE access_id=11;
UPDATE role_access SET permission=7 WHERE access_id=1;
UPDATE role_access SET scope_id=11, permission=7 WHERE access_id=13;
UPDATE role_access SET scope_id=23, permission=7 WHERE access_id=12;
UPDATE role_access SET permission=6 WHERE access_id=14;
UPDATE role_access SET scope_id=11, permission=6 WHERE access_id=16;
UPDATE role_access SET scope_id=23, permission=6 WHERE access_id=15;
DELETE FROM role_access WHERE access_id=5;

INSERT INTO role_access (role_id, scope_id, component_id, permission) VALUES ('1', '23', '8', '7');
INSERT INTO role_access (role_id, scope_id, component_id, permission) VALUES ('1', '11', '9', '7');
INSERT INTO role_access (role_id, scope_id, component_id, permission) VALUES ('1', '19', '10', '7');
INSERT INTO role_access (role_id, scope_id, component_id, permission) VALUES ('1', '18', '11', '6');
INSERT INTO role_access (role_id, scope_id, component_id, permission) VALUES ('1', '16', '12', '6');
INSERT INTO role_access (role_id, scope_id, component_id, permission) VALUES ('1', '12', '13', '6');
INSERT INTO role_access (role_id, scope_id, component_id, permission) VALUES ('1', '20', '14', '6');
INSERT INTO role_access (role_id, scope_id, component_id, permission) VALUES ('1', '21', '15', '6');
INSERT INTO role_access (role_id, scope_id, component_id, permission) VALUES ('1', '22', '16', '6');
INSERT INTO role_access (role_id, scope_id, component_id, permission) VALUES ('1', '8', '17', '7');
INSERT INTO role_access (role_id, scope_id, component_id, permission) VALUES ('1', '24', '18', '7');

INSERT INTO role_access (role_id, scope_id, component_id, permission) VALUES ('2', '6', '6', '4');
INSERT INTO role_access (role_id, scope_id, component_id, permission) VALUES ('2', '7', '7', '6');
INSERT INTO role_access (role_id, scope_id, component_id, permission) VALUES ('2', '23', '8', '6');
INSERT INTO role_access (role_id, scope_id, component_id, permission) VALUES ('2', '11', '9', '6');
INSERT INTO role_access (role_id, scope_id, component_id, permission, limit_set) VALUES ('2', '19', '10', '6', true);
INSERT INTO role_access (role_id, scope_id, component_id, permission) VALUES ('2', '18', '11', '4');
INSERT INTO role_access (role_id, scope_id, component_id, permission) VALUES ('2', '16', '12', '4');
INSERT INTO role_access (role_id, scope_id, component_id, permission) VALUES ('2', '12', '13', '4');
INSERT INTO role_access (role_id, scope_id, component_id, permission) VALUES ('2', '20', '14', '4');
INSERT INTO role_access (role_id, scope_id, component_id, permission) VALUES ('2', '21', '15', '4');
INSERT INTO role_access (role_id, scope_id, component_id, permission) VALUES ('2', '22', '16', '4');
INSERT INTO role_access (role_id, scope_id, component_id, permission) VALUES ('2', '8', '17', '6');
INSERT INTO role_access (role_id, scope_id, component_id, permission) VALUES ('2', '24', '18', '6');

INSERT INTO role_access (role_id, scope_id, component_id, permission) VALUES ('3', '2', '2', '4');
INSERT INTO role_access (role_id, scope_id, component_id, permission) VALUES ('3', '6', '6', '4');
INSERT INTO role_access (role_id, scope_id, component_id, permission) VALUES ('3', '22', '16', '4');

DELETE FROM role_access WHERE access_id=12;
DELETE FROM role_access WHERE access_id=13;
DELETE FROM role_access WHERE access_id=15;
DELETE FROM role_access WHERE access_id=16;

CREATE TABLE org_component_count (
	org_unit_id 						INT NOT NULL REFERENCES org_unit (org_unit_id) ON DELETE CASCADE ON UPDATE CASCADE,
	component_id 						INT NOT NULL REFERENCES component (component_id) ON DELETE CASCADE ON UPDATE CASCADE,
	count_total 						INT NOT NULL DEFAULT 0,
	PRIMARY KEY (org_unit_id, component_id)
);

