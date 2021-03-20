-- org unit billing information table
CREATE TABLE org_billing (
    org_unit_id                         INT NOT NULL REFERENCES org_unit (org_unit_id) ON DELETE CASCADE ON UPDATE CASCADE,
    activation_date                     TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    cycle_start                         TIMESTAMP WITH TIME ZONE,
    cycle_end                           TIMESTAMP WITH TIME ZONE,
    billing_account_id                  VARCHAR(64),
    PRIMARY KEY (org_unit_id)
);

