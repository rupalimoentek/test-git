-- User logging tables
CREATE TABLE log_user (
    log_user_id                             BIGSERIAL NOT NULL,
    ct_user_id                              INT DEFAULT NULL REFERENCES ct_user (ct_user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    org_unit_id                             INT DEFAULT NULL REFERENCES org_unit (org_unit_id) ON DELETE CASCADE ON UPDATE CASCADE,
    log_date                                TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    log_data                                JSON NOT NULL,
    PRIMARY KEY (log_user_id)
);
CREATE INDEX log_user_ct_user_id_idx ON log_user (ct_user_id);
CREATE INDEX log_user_org_unit_id_idx ON log_user (org_unit_id);
CREATE INDEX log_user_log_date_idx ON log_user (log_date);


CREATE TABLE log_campaign (
    log_campaign_id                         BIGSERIAL NOT NULL,
    campaign_id                             INT NOT NULL REFERENCES campaign (campaign_id) ON DELETE CASCADE ON UPDATE CASCADE,
    ct_user_id                              INT DEFAULT NULL REFERENCES ct_user (ct_user_id) ON DELETE CASCADE ON UPDATE CASCADE,
    org_unit_id                             INT DEFAULT NULL REFERENCES org_unit (org_unit_id) ON DELETE CASCADE ON UPDATE CASCADE,
    log_date                                TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    log_data                                JSON NOT NULL,
    PRIMARY KEY (log_campaign_id)
);
CREATE INDEX log_campaign_campaign_id_idx ON log_campaign (campaign_id);
CREATE INDEX log_campaign_org_unit_id_idx ON log_campaign (org_unit_id);
CREATE INDEX log_campaign_log_date_idx ON log_campaign (log_date);

