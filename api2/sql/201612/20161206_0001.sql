INSERT into component (component_id, component_name, component_desc,component_active) values (27, 'referral','Used to determine whether campaign move to referral state or not',true)
INSERT into scope (scope_id, scope_code, scope_display, scope_desc) VALUES (32, 'referral', 'Referral Campaign', 'Referral Campaign Access');
INSERT into component_access (component_id, scope_id) Values (27,32);
INSERT into role_access (role_id, scope_id, component_id, permission) VALUES (1,32,27,7),(2,32,27,7),(5,32,27,7),(6,32,27,7)
INSERT into org_account (org_unit_id, component_id) VALUES (8, 27);
