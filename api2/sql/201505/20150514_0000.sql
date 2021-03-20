CREATE TABLE analytic (
	analytic_id         bigserial NOT NULL,
	org_unit_id         integer NOT NULL REFERENCES org_unit (org_unit_id) ON UPDATE CASCADE ON DELETE CASCADE,
	duration            integer,
	tracking_id         character varying(45),
	all_routes          boolean DEFAULT false NOT NULL,
	all_calls           boolean DEFAULT false NOT NULL,
	analytic_created    timestamp(0) without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
	analytic_modified   timestamp(0) without time zone,
	analytic_status     character varying(20) NOT NULL DEFAULT 'none',
    PRIMARY KEY (analytic_id)
);

ALTER TABLE analytic ADD CONSTRAINT analytic_org_unit_id_key UNIQUE (org_unit_id);
ALTER TABLE analytic DROP COLUMN analytic_id;
ALTER TABLE analytic ADD CONSTRAINT analytic_org_unit_id_pri PRIMARY KEY (org_unit_id);
ALTER TABLE analytic DROP CONSTRAINT analytic_org_unit_id_key;

