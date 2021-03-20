-- modify npanxx to have area code to search against
ALTER TABLE npanxx_city ADD COLUMN npa SMALLINT;
UPDATE npanxx_city SET npa=substring(npanxx::varchar from 1 for 3)::int;

CREATE INDEX npanxx_city_npa_idx ON npanxx_city (npa);
CREATE INDEX npanxx_city_npanxx_idx ON npanxx_city (npanxx);

-- new log for ivr route
CREATE TABLE log_tag (
    log_tag_id                              BIGSERIAL NOT NULL,
    tag_id                                  INT DEFAULT NULL REFERENCES tag (tag_id) ON DELETE CASCADE ON UPDATE CASCADE,
    ct_user_id                              INT DEFAULT NULL REFERENCES ct_user (ct_user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    org_unit_id                             INT DEFAULT NULL REFERENCES org_unit (org_unit_id) ON DELETE CASCADE ON UPDATE CASCADE,
    log_date                                TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    log_data                                JSON NOT NULL,
    PRIMARY KEY (log_tag_id)
);
CREATE INDEX log_tag_org_unit_id_idx ON log_tag (org_unit_id);
CREATE INDEX log_tag_ct_user_id_idx ON log_tag (ct_user_id);
CREATE INDEX log_tag_log_date_idx ON log_tag (log_date);


CREATE TABLE phone_vendor (
    vendor_id               SERIAL NOT NULL,
    vendor_name             VARCHAR(64),
    vendor_api              VARCHAR(255),
    vendor_status           status NOT NULL DEFAULT 'active',
    vendor_started          DATE NOT NULL DEFAULT CURRENT_DATE,
    vendor_ended            DATE,
    vendor_login            VARCHAR(64),
    vendor_passwd           VARCHAR(64),
    PRIMARY KEY (vendor_id)
);

INSERT INTO phone_vendor (vendor_name, vendor_api, vendor_login, vendor_passwd) VALUES
    ('Convirza', 'https://api.convirza.com', null, null),
    ('Vitelity', 'http://api.vitelity.net/api.php', 'cont_actpoint', 'Power1664'),
    ('Bandwidth', 'https://api.inetwork.com/v1.0', 'contactpoint_user', 'l2E76M43');

CREATE TYPE phone_status AS ENUM ('suspended', 'reserved', 'provisioned', 'unprovisioned');

ALTER TABLE phone_number DROP COLUMN phone_number_ou_id;
ALTER TABLE phone_number DROP COLUMN provisioned_route_id;
ALTER TABLE phone_number DROP COLUMN phone_number_modified;
ALTER TABLE phone_number DROP COLUMN phone_number_pool_id;
ALTER TABLE phone_number DROP COLUMN number_type;
ALTER TABLE phone_number DROP COLUMN carrier;
ALTER TABLE phone_number ALTER COLUMN phone_number_created SET DATA TYPE date;
ALTER TABLE phone_number ADD COLUMN vendor_id INT NOT NULL DEFAULT 1 REFERENCES phone_vendor (vendor_id) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE phone_number ALTER COLUMN phone_number_status DROP DEFAULT;
ALTER TABLE phone_number ALTER COLUMN phone_number_status SET DATA TYPE phone_status USING phone_number_status::phone_status;
ALTER TABLE phone_number ALTER COLUMN phone_number_status SET DEFAULT 'unprovisioned';

ALTER TABLE phone_number ADD COLUMN npa SMALLINT;
ALTER TABLE phone_number ADD COLUMN npanxx INT;

UPDATE phone_number SET npa=substring(number from 1 for 3)::int;
UPDATE phone_number SET npanxx=substring(number from 1 for 6)::int;

ALTER TABLE phone_number ALTER COLUMN number DROP DEFAULT;
ALTER TABLE phone_number ALTER COLUMN number SET DATA TYPE BIGINT USING number::bigint;
