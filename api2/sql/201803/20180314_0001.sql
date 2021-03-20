--1.Need to update Org_Unit_details table for CA On/Off status
ALTER TABLE org_unit_detail ADD COLUMN spam_guard_status VARCHAR(10) NULL
ALTER TABLE default_dni_setting ADD COLUMN share_with_subgroup BOOLEAN false

