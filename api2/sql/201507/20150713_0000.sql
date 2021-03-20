INSERT INTO role_access (role_id, scope_id, component_id, permission) VALUES
    ('4', '1', '1', '7'),
    ('4', '2', '2', '7'),
    ('4', '3', '3', '7'),
    ('4', '6', '6', '7'),
    ('4', '7', '7', '7'),
    ('4', '23', '8', '7'),
    ('4', '11', '9', '7'),
    ('4', '19', '10', '7'),
    ('4', '18', '11', '7'),
    ('4', '16', '12', '7'),
    ('4', '12', '13', '7'),
    ('4', '20', '14', '7'),
    ('4', '21', '15', '7'),
    ('4', '22', '16', '7'),
    ('4', '8', '17', '7'),
    ('4', '24', '18', '7'),
    ('4', '25', '19', '7'),
    ('4', '26', '20', '7'),
    ('4', '27', '23', '7');

INSERT INTO role (role_name) VALUES ('Support Admin');
INSERT INTO role (role_name) VALUES ('Super Admin');
UPDATE role SET role_name='Account Admin' WHERE role_id='4';

ALTER TABLE role_access ALTER COLUMN component_id SET DEFAULT NULL;
ALTER TABLE role_access ALTER COLUMN component_id DROP NOT NULL;

INSERT INTO scope (scope_code, scope_display, scope_desc) VALUES ('super', 'Super Admin', 'For internal use by super admin users only');
INSERT INTO role_access (role_id, scope_id, permission) VALUES ('6', '28', '7');

ALTER TABLE ct_user DROP COLUMN admin;
DROP TYPE admin_type;

UPDATE org_unit SET org_unit_ext_id=null, org_unit_name='Convirza', org_unit_parent_id='1', top_ou_id='1', billing_id='1' WHERE org_unit_id='1';

ALTER TYPE callaction ADD VALUE 'doubleclick' BEFORE 'none';
ALTER TYPE mine_status ADD VALUE 'cancel' BEFORE 'none';

CREATE TYPE rulejoin AS ENUM('AND', 'OR', 'NONE');
ALTER TABLE call_action_rule ALTER COLUMN join_type DROP DEFAULT;
ALTER TABLE call_action_rule ALTER COLUMN join_type SET DATA TYPE rulejoin USING join_type::rulejoin;
ALTER TABLE call_action_rule ALTER COLUMN join_type SET DEFAULT 'NONE';

DELETE FROM call_action_rule WHERE operator='contains';
CREATE TYPE operant AS ENUM('=', '!=', '>', '<', '>=', '<=', 'ILIKE', 'NOT ILIKE', 'BWITH', 'EWITH');
ALTER TABLE call_action_rule ALTER COLUMN operator SET DATA TYPE operant USING operator::operant;


