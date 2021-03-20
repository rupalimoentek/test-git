-- new user column
ALTER TABLE ct_user ADD COLUMN tl_ou_id INT DEFAULT NULL REFERENCES org_unit (org_unit_id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE location ALTER COLUMN location_created SET DATA TYPE TIMESTAMP(0) with time zone;
ALTER TABLE location ALTER COLUMN location_modified SET DATA TYPE TIMESTAMP(0) with time zone;
