-- New component for subscriptions
INSERT INTO component (component_name, component_desc) VALUES ('Inactive Numbers', 'For phone numbers that are reserved but currently not in use');
-- following SQL relies on this insert being 22 for component_id

INSERT INTO subscription_component (subscription_id, component_id, component_threshold_max, component_ext_id) VALUES
    ('8', '22', '500', '2c92c0f94ddbecdb014ddee928ad0a3c'),
    ('9', '22', '500', '2c92c0f94ddbece2014ddee79f0468f7'),
    ('10', '22', '500', '2c92c0f84ddbe245014ddecf42c53af7');

INSERT INTO org_component_count (org_unit_id, component_id) (SELECT org_unit_id, '22' AS component_id FROM org_unit WHERE org_unit_parent_id IS NULL);
-- create minutes count for second level OUs
INSERT INTO org_component_count (org_unit_id, component_id)
    (SELECT org_unit_id, '22' AS component_id FROM org_unit WHERE org_unit_parent_id IN
         (SELECT org_unit_id FROM org_unit WHERE org_unit_parent_id IS NULL)
    );
-- create minutes count for third level OUs
INSERT INTO org_component_count (org_unit_id, component_id)
    (SELECT org_unit_id, '22' AS component_id FROM org_unit WHERE org_unit_parent_id IN
         (SELECT org_unit_id FROM org_unit WHERE org_unit_parent_id IN
              (SELECT org_unit_id FROM org_unit WHERE org_unit_parent_id IS NULL)
         )
    );

CREATE TABLE npanxx_city (
    city_id                 SERIAL NOT NULL,
    npanxx                  INT NOT NULL,
    state                   VARCHAR(2) NOT NULL,
    city                    VARCHAR(48) NOT NULL,
    PRIMARY KEY (city_id)
);
CREATE INDEX npanxx_city_city_idx ON npanxx_city (city);

-- create universal status ENUM
CREATE TYPE status AS ENUM ('active', 'inactive', 'deleted');
UPDATE ct_user SET user_status='active' WHERE user_status='Active';
UPDATE ct_user SET user_status='inactive' WHERE user_status='Inactive';
ALTER TABLE ct_user ALTER COLUMN user_status DROP DEFAULT;
ALTER TABLE ct_user ALTER COLUMN user_status SET DATA TYPE status USING user_status::status;
ALTER TABLE ct_user ALTER COLUMN user_status SET DEFAULT 'active';

ALTER TABLE org_unit ALTER COLUMN org_unit_status DROP DEFAULT;
ALTER TABLE org_unit ALTER COLUMN org_unit_status SET DATA TYPE status USING org_unit_status::status;
ALTER TABLE org_unit ALTER COLUMN org_unit_status SET DEFAULT 'active';

UPDATE provisioned_route SET provisioned_route_status='active' WHERE provisioned_route_status!='active' OR provisioned_route_status!='inactive' OR provisioned_route_status!='deleted';
ALTER TABLE provisioned_route ALTER COLUMN provisioned_route_status DROP DEFAULT;
ALTER TABLE provisioned_route ALTER COLUMN provisioned_route_status SET DATA TYPE status USING provisioned_route_status::status;
ALTER TABLE provisioned_route ALTER COLUMN provisioned_route_status SET DEFAULT 'active';

ALTER TABLE campaign ALTER COLUMN campaign_status DROP DEFAULT;
ALTER TABLE campaign ALTER COLUMN campaign_status SET DATA TYPE status USING campaign_status::status;
ALTER TABLE campaign ALTER COLUMN campaign_status SET DEFAULT 'active';

ALTER TABLE webhook DROP COLUMN webhook_active;
ALTER TABLE webhook ADD COLUMN webhook_status status, ALTER COLUMN webhook_status SET DEFAULT 'active';
UPDATE webhook SET webhook_status='active';

