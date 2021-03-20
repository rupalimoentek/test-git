ALTER TABLE ct_user_detail ALTER COLUMN timezone TYPE VARCHAR(50);
ALTER TABLE ct_user_detail ALTER COLUMN timezone SET DEFAULT 'America/New_York';

ALTER TABLE org_doubleclick ADD COLUMN all_call BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE org_doubleclick ADD COLUMN duration SMALLINT NOT NULL DEFAULT 0;

ALTER TABLE admin_log DROP CONSTRAINT admin_log_admin_id_fkey;
DROP TABLE admin_user;
ALTER TABLE admin_log DROP COLUMN admin_id;
ALTER TABLE admin_log ADD COLUMN ct_user_id INT NOT NULL REFERENCES ct_user (ct_user_id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE admin_log ADD COLUMN access_token VARCHAR(64);


ALTER TABLE ct_user DROP COLUMN system_admin;
ALTER TABLE ct_user DROP COLUMN support_admin;
ALTER TABLE ct_user DROP COLUMN super_admin;

CREATE TYPE admin_type AS ENUM ('none', 'system', 'support', 'super');
ALTER TABLE ct_user ADD COLUMN admin admin_type NOT NULL DEFAULT 'none';

INSERT INTO role (role_name) VALUES ('system');

ALTER TABLE org_dc_map ALTER COLUMN floodlight_var SET DEFAULT NULL;
ALTER TABLE org_dc_map ALTER COLUMN floodlight_var DROP NOT NULL;
ALTER TABLE org_dc_map ADD CONSTRAINT org_dc_map_doubleclick_id_map_id_key UNIQUE (doubleclick_id, map_id);
ALTER TABLE doubleclick_call ADD COLUMN org_unit_id INT NOT NULL REFERENCES org_unit (org_unit_id) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE doubleclick_metric ADD COLUMN map_id INT NOT NULL REFERENCES doubleclick_mapping (map_id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE doubleclick_call ADD COLUMN org_unit_id INT NOT NULL REFERENCES org_doubleclick (org_unit_id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE doubleclick_metric DROP COLUMN floodlight_var;
ALTER TABLE doubleclick_metric DROP COLUMN metric_field;
ALTER TABLE doubleclick_metric DROP COLUMN map_type;
ALTER TABLE doubleclick_metric DROP COLUMN indicator_id;
ALTER TABLE doubleclick_metric DROP COLUMN call_metric_id;

