-- fixing DNI_ORG_UNIT
DELETE FROM dni_org_unit WHERE org_unit_id=8 OR org_unit_id=71 OR org_unit_id=91 OR org_unit_id=120 OR org_unit_id=125;
DELETE FROM dni_org_unit WHERE org_unit_id=263 OR org_unit_id=268 OR org_unit_id=106 OR org_unit_id=129 OR org_unit_id=114;

SELECT nextval('dni_org_unit_dni_org_unit_id_seq');
INSERT INTO dni_org_unit (org_unit_id, dni_code) VALUES
    ('8', 'c9f0f895fb98ab9159f51fd0297e236d'),
    ('71', 'e2c420d928d4bf8ce0ff2ec19b371514'),
    ('91', '54229abfcfa5649e7003b83dd4755294'),
    ('120', 'da4fb5c6e93e74d3df8527599fa62642'),
    ('125', '3def184ad8f4755ff269862ea77393dd');

ALTER TABLE dni_setting DROP CONSTRAINT dni_setting_dni_org_unit_id_fkey;
ALTER TABLE dni_org_unit DROP CONSTRAINT dni_org_unit_pkey;
--ALTER TABLE dni_org_unit ADD CONSTRAINT dni_org_unit_pkey PRIMARY KEY (org_unit_id);
ALTER TABLE dni_setting ADD COLUMN org_unit_id INT DEFAULT NULL REFERENCES dni_org_unit (org_unit_id) ON DELETE SET NULL ON UPDATE CASCADE;

UPDATE dni_setting SET org_unit_id=120 WHERE dni_org_unit_id=22 OR dni_org_unit_id=23;
UPDATE dni_setting SET org_unit_id=125 WHERE dni_org_unit_id=24;
UPDATE dni_setting SET org_unit_id=128 WHERE dni_org_unit_id=69;
UPDATE dni_setting SET org_unit_id=130 WHERE dni_org_unit_id=70;
UPDATE dni_setting SET org_unit_id=122 WHERE dni_org_unit_id=71;
UPDATE dni_setting SET org_unit_id=124 WHERE dni_org_unit_id=72;
UPDATE dni_setting SET org_unit_id=121 WHERE dni_org_unit_id=73;
UPDATE dni_setting SET org_unit_id=73 WHERE dni_org_unit_id=74;

ALTER TABLE dni_org_unit DROP COLUMN dni_org_unit_id;
ALTER TABLE dni_setting DROP COLUMN dni_org_unit_id;

--DROP SEQUENCE dni_org_unit_dni_org_unit_id_seq;
