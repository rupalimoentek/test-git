CREATE OR REPLACE RULE get_pkey_on_insert AS ON INSERT TO dni_setting DO  SELECT currval('dni_setting_dni_setting_id_seq'::text::regclass) AS dni_setting_id;

CREATE TYPE dnitype AS ENUM ('source', 'session', 'url');

ALTER TABLE dni_setting ALTER dni_type SET DATA TYPE dnitype USING dni_type::dnitype;

ALTER TABLE dni_setting DROP COLUMN last_verified;


