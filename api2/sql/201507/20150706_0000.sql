-- table for Convirza admin user accounts
CREATE TABLE admin_user (
    admin_id                SERIAL NOT NULL,
    admin_fname             VARCHAR(64) NOT NULL,
    admin_lname             VARCHAR(64) NOT NULL,
    admin_login             VARCHAR(128) NOT NULL,
    admin_passwd            VARCHAR(128) NOT NULL,
    super_admin             BOOLEAN NOT NULL DEFAULT false,
    UNIQUE (admin_login),
    PRIMARY KEY (admin_id)
);

CREATE TABLE admin_log (
    admin_log_id            BIGSERIAL NOT NULL,
    admin_id                INT NOT NULL REFERENCES admin_user (admin_id) ON DELETE CASCADE ON UPDATE CASCADE,
    org_unit_id             INT NOT NULL REFERENCES org_unit (org_unit_id) ON DELETE CASCADE ON UPDATE CASCADE,
    log_created             TIMESTAMP(0) with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (admin_log_id)
);

ALTER TABLE org_billing ADD COLUMN allow_admin BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE ct_user ADD COLUMN system_admin BOOLEAN NOT NULL DEFAULT false;

-- ALTER TABLE ct_user ALTER COLUMN user_status SET DATA TYPE status USING user_status::status;
ALTER TABLE ct_user ALTER COLUMN user_status SET DEFAULT 'active';