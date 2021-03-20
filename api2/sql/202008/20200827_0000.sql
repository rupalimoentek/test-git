-- Get expected ids before running inserts if not occupied 
SELECT setval('component_component_id_seq', (SELECT MAX(component_id) FROM component));
INSERT INTO component (component_id, component_name, component_desc) VALUES (951 ,'sms', 'This Component is created for SMS Feature.');

SELECT setval('scope_scope_id_seq', (SELECT MAX(scope_id) FROM scope));
INSERT INTO scope (scope_id, scope_code, scope_display, scope_desc) VALUES (41, 'sms', 'sms', 'This Component is created for SMS Feature.');

-- admin,standerd, account admin has full access, read only can see but not do anything, identified cant see anything
INSERT INTO role_access (role_id, scope_id, component_id, permission) VALUES ('1', '41', '951', '7'), ('4', '41', '951', '7'), ('2', '41', '951', '7'), ('3', '41', '951', '5'), ('8', '41', '951', '4');

-- Add Columns in table 
ALTER TABLE ce_call_flows ADD COLUMN sms_enabled boolean default false;
ALTER TABLE phone_detail ADD COLUMN sms_enabled boolean default false;
