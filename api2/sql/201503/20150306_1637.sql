ALTER TABLE component DROP COLUMN threshold_max;
ALTER TABLE component DROP COLUMN threshold_call;
ALTER TABLE subscription_component DROP COLUMN component_threshold_call;
ALTER TABLE org_account ADD COLUMN threshold_max INT NOT NULL DEFAULT 0;
ALTER TABLE org_account DROP COLUMN element_quantity;
ALTER TABLE role_access DROP COLUMN limit_set;

ALTER TABLE campaign ADD COLUMN campaign_start_date timestamp without time zone;
ALTER TABLE campaign ADD COLUMN campaign_end_date timestamp without time zone;

CREATE RULE get_pkey_on_insert AS ON INSERT TO campaign DO SELECT currval('campaign_campaign_id_seq'::text) AS campaign_id;
CREATE RULE get_pkey_on_insert AS ON INSERT TO provisioned_route DO SELECT currval('provisioned_route_provisioned_route_id_seq'::text) AS provisioned_route_id;
CREATE RULE get_pkey_on_insert AS ON INSERT TO org_unit DO SELECT currval('org_unit_org_unit_id_seq'::text) AS org_unit_id;

ALTER TABLE provisioned_route ADD COLUMN phone_number_modified timestamp without time zone DEFAULT NULL;