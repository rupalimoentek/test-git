ALTER TABLE campaign ADD COLUMN campaign_owner_user_id integer;

INSERT INTO component_access (component_id, scope_id, component_permission) VALUES ('10', '19', '7');
INSERT INTO component_access (component_id, scope_id, component_permission) VALUES ('11', '18', '6');
INSERT INTO component_access (component_id, scope_id, component_permission) VALUES ('12', '16', '6');
INSERT INTO component_access (component_id, scope_id, component_permission) VALUES ('13', '12', '6');
INSERT INTO component_access (component_id, scope_id, component_permission) VALUES ('14', '20', '6');
INSERT INTO component_access (component_id, scope_id, component_permission) VALUES ('15', '21', '6');
INSERT INTO component_access (component_id, scope_id, component_permission) VALUES ('16', '22', '6');
INSERT INTO component_access (component_id, scope_id, component_permission) VALUES ('8', '23', '7');
INSERT INTO component_access (component_id, scope_id, component_permission) VALUES ('9', '11', '7');
INSERT INTO component_access (component_id, scope_id, component_permission) VALUES ('17', '8', '7');
INSERT INTO component_access (component_id, scope_id, component_permission) VALUES ('18', '24', '7');

CREATE TABLE ivr_key (
	ivr_key_id 			serial NOT NULL,
	key character 		varchar(40) NOT NULL,
	call_detail_id 		integer NOT NULL,
	ivr_created 		timestamp without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY (ivr_key_id )
);

CREATE RULE get_pkey_on_insert AS
    ON INSERT TO ct_user DO  SELECT currval(('ct_user_ct_user_id_seq'::text)::regclass) AS ct_user_id;

CREATE TABLE provisioned_route_number (
    route_number_id                 SERIAL NOT NULL,
    provisioned_route_id            INT NOT NULL REFERENCES provisioned_route (provisioned_route_id) ON DELETE NO ACTION ON UPDATE CASCADE,
    phone_number_id                 INT NOT NULL REFERENCES phone_number (phone_number_id) ON DELETE NO ACTION ON UPDATE CASCADE,
    assign_active                   BOOLEAN NOT NULL DEFAULT true,
    date_assigned                   TIMESTAMP without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_removed                    TIMESTAMP without time zone DEFAULT NULL,
    PRIMARY KEY (route_number_id)
);
-- remove constraint to provisioned routes from phone_number
ALTER TABLE phone_number DROP CONSTRAINT phone_number_provisioned_route_id_fkey;
-- populate provisioned_route_number based on current records
INSERT INTO provisioned_route_number (provisioned_route_id, phone_number_id)
    SELECT provisioned_route_id, phone_number_id FROM phone_number WHERE provisioned_route_id IS NOT NULL;

DELETE FROM role_access WHERE access_id='18';
DELETE FROM role_access WHERE access_id='12';
DELETE FROM role_access WHERE access_id='15';
DELETE FROM role_access WHERE access_id='16';
DELETE FROM role_access WHERE access_id='6';

-- ALTER TABLE phone_number DROP COLUMN provisioned_route_id;

