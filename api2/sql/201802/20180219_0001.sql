CREATE SEQUENCE default_call_action_seq START WITH 1; -- replace 12345 with max above
ALTER TABLE default_call_action ALTER COLUMN default_action_id SET DEFAULT nextval('default_call_action_seq');


CREATE OR REPLACE RULE get_pkey_on_insert AS
    ON INSERT TO default_call_action DO  SELECT currval('default_call_action_seq'::text::regclass) AS default_action_id;

ALTER TABLE default_provisioned_route 
   ALTER COLUMN ring_to_number TYPE BIGINT
