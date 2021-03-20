CREATE TABLE log_distribution_list (
  log_distribution_list_id SERIAL NOT NULL,
  distribution_list_id INT NOT NULL,-- REFERENCES email_list (list_id) ON DELETE CASCADE ON UPDATE CASCADE,
  org_unit_id INT NOT NULL REFERENCES org_unit (org_unit_id) ON DELETE CASCADE ON UPDATE CASCADE,
  ct_user_id BIGINT NOT NULL REFERENCES ct_user (ct_user_id) ON DELETE CASCADE ON UPDATE CASCADE,
  log_date timestamp(3) with time zone NOT NULL DEFAULT now(),
  log_data json NOT NULL,
  PRIMARY KEY (log_distribution_list_id)
);

--CREATE OR REPLACE RULE get_pkey_on_insert AS
--    ON INSERT TO log_distribution_list DO  SELECT currval('log_distribution_list_log_distribution_list_id_seq'::text::regclass) AS distribution_list_id;

CREATE INDEX log_distribution_list_log_date_idx ON log_distribution_list USING btree (log_date);
CREATE INDEX log_distribution_list_org_unit_id_idx ON log_distribution_list USING btree (org_unit_id);
CREATE INDEX log_distribution_list_ct_user_id_idx ON log_distribution_list USING btree (ct_user_id);