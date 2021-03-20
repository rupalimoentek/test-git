-- modifications and additions for RESERVED phone numbers
CREATE TYPE numtype AS ENUM ('did', 'did-vanity', 'sequential', 'repeater', 'canadian', 'tfn', 'tfn-vanity');

ALTER TYPE phone_status ADD VALUE 'available';
ALTER TABLE phone_number ADD COLUMN phone_type numtype NOT NULL DEFAULT 'did';
ALTER TABLE phone_number ALTER COLUMN phone_number_status SET DEFAULT 'available';

CREATE TABLE reserved_number (
    reserved_id 				SERIAL NOT NULL,
    phone_number_id				INT NOT NULL REFERENCES phone_number(phone_number_id) ON DELETE CASCADE ON UPDATE CASCADE,
    org_unit_id 				INT NOT NULL REFERENCES org_unit(org_unit_id) ON DELETE CASCADE ON UPDATE CASCADE,
    number_added 				TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (reserved_id)
);
CREATE INDEX reserved_number_org_unit_id_idx ON reserved_number (org_unit_id);

GRANT INSERT, UPDATE, SELECT, DELETE ON reserved_number TO interact;
GRANT SELECT, UPDATE ON reserved_number_reserved_id_seq TO interact;
