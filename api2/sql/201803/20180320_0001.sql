CREATE TABLE public.default_org_setting
(
  org_unit_id integer NOT NULL,
  conversation_analytics_status character varying(10),
  spam_guard_status character varying(10),
    overwrite_feature_settings boolean DEFAULT false,
      overwrite_tracking_number_settings boolean DEFAULT false,
      overwrite_call_action_settings boolean DEFAULT false,
  CONSTRAINT default_org_setting_org_unit_id_fkey FOREIGN KEY (org_unit_id)
      REFERENCES public.org_unit (org_unit_id) MATCH SIMPLE
      ON UPDATE CASCADE ON DELETE SET NULL
)


ALTER TABLE public.org_unit_detail 
DROP COLUMN conversation_analytics_status, 
DROP COLUMN spam_guard_status;
