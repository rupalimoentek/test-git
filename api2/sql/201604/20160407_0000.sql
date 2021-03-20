-- Add sandbox environments to vendor
CREATE TABLE phone_vendor_api (
    vendor_id                   INT NOT NULL REFERENCES phone_vendor (vendor_id) ON DELETE CASCADE ON UPDATE CASCADE,
    api_host                    VARCHAR(128),
    api_user                    VARCHAR(64),
    api_pass                    VARCHAR(64),
    api_port                    SMALLINT NOT NULL DEFAULT 80,
    api_path                    VARCHAR(128),
    sandbox_host                VARCHAR(128),
    sandbox_user                VARCHAR(64),
    sandbox_pass                VARCHAR(64),
    sandbox_port                SMALLINT NOT NULL DEFAULT 80,
    sandbox_path                VARCHAR(128),
    CHECK (api_port = 80 OR api_port = 443),
    CHECK (sandbox_port = 80 OR sandbox_port = 443),
    PRIMARY KEY (vendor_id)
);

INSERT INTO phone_vendor_api (vendor_id, api_host, api_user, api_pass, api_port, api_path, sandbox_host, sandbox_user, sandbox_pass, sandbox_port, sandbox_path) VALUES
    ('7', 'dashboard.bandwidth.com', 'contactpoint_user2', 'Band1234', 443, '/api/accounts/5000600/', 'test.dashboard.bandwidth.com', 'convirza_telecom', 'Band1234', 443, '/api/accounts/5000600/');

