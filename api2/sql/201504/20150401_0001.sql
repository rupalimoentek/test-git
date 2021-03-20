CREATE TABLE dni_org_unit (
    dni_org_unit_id         SERIAL NOT NULL,
    org_unit_id             INT NOT NULL REFERENCES org_unit (org_unit_id) ON UPDATE CASCADE ON DELETE CASCADE,
    dni_code                VARCHAR(255) NOT NULL,
    custom_params           text,
    dni_org_unit_created    timestamp(0) without time zone  NOT NULL DEFAULT CURRENT_TIMESTAMP,
    dni_org_unit_modified   timestamp without time zone,
    PRIMARY KEY (dni_org_unit_id)
);

CREATE RULE get_pkey_on_insert AS ON INSERT TO dni_org_unit DO SELECT currval(('dni_org_unit_dni_org_unit_id_seq'::text)::regclass) AS dni_org_unit_id;

CREATE TABLE dni_setting (
    dni_setting_id          SERIAL NOT NULL,
    dni_org_unit_id         INT NOT NULL REFERENCES dni_org_unit (dni_org_unit_id) ON UPDATE CASCADE ON DELETE CASCADE,
    destination_url         VARCHAR(255),
    dni_type                VARCHAR(20),
    dni_element             VARCHAR(100),
    provisioned_route_id    INT DEFAULT NULL REFERENCES provisioned_route (provisioned_route_id) ON UPDATE CASCADE ON DELETE SET NULL,
    referer                 VARCHAR(255),
    referer_type            VARCHAR(100),
    dni_active              boolean NOT NULL DEFAULT true,
    last_verified           timestamp(0) without time zone,
    dni_ttl                 smallint,
    dni_setting_created     timestamp(0) without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    dni_setting_modified    timestamp(0) without time zone,
    PRIMARY KEY (dni_setting_id)
);

