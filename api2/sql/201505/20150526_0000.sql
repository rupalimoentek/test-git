-- update billing node records to point to themselves
UPDATE org_unit SET billing_id=org_unit_id WHERE org_unit_parent_id IS NULL;

-- adjust billing table columns
ALTER TABLE org_component_count ALTER COLUMN count_start SET DATA TYPE TIMESTAMP(0) with time zone;
ALTER TABLE subscription_component ADD COLUMN component_ext_id VARCHAR(64);

-- new log for billing
CREATE TABLE log_billing (
    log_billing_id                          BIGSERIAL NOT NULL,
    billing_id                              VARCHAR(64),
    ct_user_id                              INT DEFAULT NULL REFERENCES ct_user (ct_user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    org_unit_id                             INT DEFAULT NULL REFERENCES org_unit (org_unit_id) ON DELETE CASCADE ON UPDATE CASCADE,
    log_date                                TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    log_data                                JSON NOT NULL,
    PRIMARY KEY (log_billing_id)
);
CREATE INDEX log_billing_billing_id_idx ON log_billing (billing_id);
CREATE INDEX log_billing_org_unit_id_idx ON log_billing (org_unit_id);
CREATE INDEX log_billing_ct_user_id_idx ON log_billing (ct_user_id);
CREATE INDEX log_billing_log_date_idx ON log_billing (log_date);

-- new log for ivr route
CREATE TABLE log_ivr (
    log_ivr_id                              BIGSERIAL NOT NULL,
    ivr_id                                  VARCHAR(64),
    ct_user_id                              INT DEFAULT NULL REFERENCES ct_user (ct_user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    org_unit_id                             INT DEFAULT NULL REFERENCES org_unit (org_unit_id) ON DELETE CASCADE ON UPDATE CASCADE,
    log_date                                TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    log_data                                JSON NOT NULL,
    PRIMARY KEY (log_ivr_id)
);
CREATE INDEX log_ivr_org_unit_id_idx ON log_ivr (org_unit_id);
CREATE INDEX log_ivr_ct_user_id_idx ON log_ivr (ct_user_id);
CREATE INDEX log_ivr_log_date_idx ON log_ivr (log_date);
