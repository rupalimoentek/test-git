CREATE TYPE usage_type AS ENUM ('PREMIUM', 'LOCAL', 'LDM');

ALTER TABLE call_detail ADD COLUMN usage_type usage_type;

ALTER TABLE call_detail RENAME COLUMN ldm_component_id TO usage_component_id;

UPDATE call_detail SET usage_type = 'LDM' where is_ldm = true;

ALTER TABLE call_detail DROP COLUMN is_ldm;

UPDATE call_Detail SET usage_type = 'PREMIUM' WHERE
call_id IN (SELECT c.call_id FROM call c
JOIN org_unit ou ON ( ou.org_unit_id = c.org_unit_id )
JOIN provisioned_route_number prn ON (c.provisioned_route_id = prn.provisioned_route_id)
JOIN org_component oc ON((prn.phone_number_id = oc.number_id) AND (oc.org_unit_id = c.org_unit_id) AND component_type = 'minute'));

UPDATE call_Detail SET usage_type = 'LOCAL', usage_component_id = 21 WHERE usage_type is NULL;