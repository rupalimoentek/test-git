-- adding new component and scope
INSERT INTO component (component_name, component_desc) VALUES ('Tags', 'Ability to tag calls as being a specific type');
-- should be #23

INSERT INTO scope (scope_code, scope_display, scope_desc) VALUES ('tag', 'Call Tagging', 'Ability to tag calls as being a specific type');
-- should be #27

INSERT INTO component_access (component_id, scope_id, component_permission) VALUES ('23', '27', '7');

INSERT INTO role_access (role_id, scope_id, component_id, permission) VALUES
    ('1', '27', '23', '7'),
    ('2', '27', '23', '6');

INSERT INTO subscription_component (subscription_id, component_id) VALUES
    ('8', '23'),
    ('9', '23'),
    ('10', '23');