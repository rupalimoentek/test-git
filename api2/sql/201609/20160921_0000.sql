
ALTER TABLE filter_rule ADD COLUMN filter_type VARCHAR(64);
--ALTER TABLE filter_inc ADD COLUMN filter_type VARCHAR(64);
ALTER TABLE filter_rule ALTER COLUMN comparator SET DATA TYPE VARCHAR(64);

ALTER TABLE filter_rule ALTER COLUMN comparator SET DATA TYPE VARCHAR(7);
--UPDATE filter_rule SET filter_inc='include' WHERE filter_inc IS NULL;
--UPDATE filter_rule SET filter_inc='include' WHERE filter_inc!='include' AND filter_inc!='exclude';
UPDATE filter_rule SET comparator='=' WHERE comparator='is' OR comparator='equals' OR comparator='eq' OR comparator IS NULL OR comparator='include';
UPDATE filter_rule SET comparator='ILIKE' WHERE comparator='contains';

--ALTER TABLE filter_rule ALTER COLUMN filter_inc SET DEFAULT 'include';
--ALTER TABLE filter_rule ALTER COLUMN filter_inc SET NOT NULL;
ALTER TABLE filter_rule ALTER COLUMN comparator SET DATA TYPE operant USING comparator::operant;
--ALTER TABLE filter_rule ADD CONSTRAINT filter_rule_filter_inc_chk CHECK (filter_inc='include' OR filter_inc='exclude');

DROP TYPE "public"."phone_status";

TRUNCATE TABLE report_sched CASCADE;
ALTER TABLE report_sched ADD COLUMN org_unit_id INT NOT NULL REFERENCES org_unit (org_unit_id) ON DELETE CASCADE ON UPDATE CASCADE;

-- ===== changes to filter_rule =======================
CREATE TYPE comparator AS ENUM ('=', '!=', '>=', '<=', '~*', '!~*');
ALTER TABLE filter_rule DROP COLUMN comparator;
ALTER TABLE filter_rule ADD COLUMN comparator comparator NOT NULL DEFAULT '=';
ALTER TABLE filter_rule ADD COLUMN filter_join rulejoin NOT NULL DEFAULT 'NONE';
--ALTER TABLE filter_rule DROP COLUMN filter_inc;

ALTER TABLE filter DROP COLUMN ct_user_id;

GRANT SELECT,INSERT,UPDATE,DELETE ON number_owner TO interact;
GRANT SELECT,INSERT,UPDATE,DELETE ON log_phone TO interact;
GRANT SELECT,INSERT,UPDATE,DELETE ON phone_detail TO interact;
GRANT SELECT,INSERT,UPDATE,DELETE ON phone_number TO interact;
GRANT SELECT,INSERT,UPDATE,DELETE ON phone_tier TO interact;

GRANT SELECT,UPDATE ON log_phone_log_phone_id_seq TO interact;
GRANT SELECT,UPDATE ON number_owner_owner_id_seq TO interact;
GRANT SELECT,UPDATE ON phone_number_number_id_seq TO interact;
GRANT SELECT,UPDATE ON phone_tier_tier_seq TO interact;

--DROP TABLE log_distribution_list;
DROP TABLE reserved_number;

