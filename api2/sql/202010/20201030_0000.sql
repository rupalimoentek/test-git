SELECT setval('component_component_id_seq', (SELECT MAX(component_id)+1 FROM component));  // 952
-- Use value returned in the previous SQL query as component_id in next SQL queries.
 
INSERT INTO component (component_id, component_name, component_desc) 
VALUES (952 ,'Download Audio', 'This Component is created for download audio permission.');

SELECT setval('scope_scope_id_seq', (SELECT MAX(scope_id)+1 FROM scope)); // 42

-- Use value returned in the previous SQL query as scope_id in next SQL queries.
INSERT INTO scope (scope_id, scope_code, scope_display, scope_desc) VALUES (42, 'downloadaudio', 'Download Audio', 'This Component is created for download audio Permission.');

-- Admin, account admin has full access
--Use previously used scope_id and component_id in the next SQL query.
INSERT INTO role_access (role_id, scope_id, component_id, permission) VALUES ('1', '42', '952', '7')

ALTER TABLE org_data_append_setting ADD COLUMN download_audio_enabled boolean default true; 

-- Make sure caller privacy component already enabled for the account 
-- Add download audio component to account
INSERT INTO org_account(org_unit_id, component_id)VALUES(8,952);
