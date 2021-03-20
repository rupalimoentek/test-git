--1.Need to update Org_Unit_details table for CA On/Off status
ALTER TABLE org_unit_detail ADD COLUMN conversation_analytics_status VARCHAR(10) NULL;


--2.Create table for Default Call Flow setting

CREATE TYPE play_disclaimer AS ENUM (
'Before voice prompt',
'After voice prompt',
'Never'
);

CREATE TABLE public.default_provisioned_route(
  org_unit_id INTEGER,
  record_call BOOLEAN DEFAULT true,
  play_voice_prompt_first BOOLEAN DEFAULT true,
  play_whisper_message BOOLEAN DEFAULT true,
  play_voice_prompt_first_text TEXT,
  play_whisper_message_text TEXT,
  ring_to_number INTEGER, 
  play_disclaimer play_disclaimer NOT NULL DEFAULT 'Before voice prompt'::play_disclaimer,
  CONSTRAINT org_unit_id_fkey FOREIGN KEY (org_unit_id)
      REFERENCES public.org_unit (org_unit_id) MATCH SIMPLE
      ON UPDATE CASCADE ON DELETE CASCADE
);

--3.Create table for Default Call Action setting
CREATE TABLE public.default_call_action(
  org_unit_id INTEGER,
  default_action_id integer NOT NULL,
  post_process boolean NOT NULL DEFAULT false,
  action_order smallint NOT NULL DEFAULT 1,
  action callaction NOT NULL DEFAULT 'none'::callaction,
  action_target character varying(255),
  action_created timestamp(0) without time zone NOT NULL DEFAULT now(),
  action_updated timestamp(0) without time zone,
    CONSTRAINT org_unit_id_fkey FOREIGN KEY (org_unit_id)
      REFERENCES public.org_unit (org_unit_id) MATCH SIMPLE
      ON UPDATE CASCADE ON DELETE CASCADE
);


CREATE TABLE public.default_call_action_rule
(
  rule_id SERIAL NOT NULL,
  default_action_id integer NOT NULL,
  data_field character varying(128),
  indicator_id integer,
  operator operant NOT NULL,
  comparator character varying(128),
  join_type rulejoin NOT NULL DEFAULT 'NONE'::rulejoin,
  rule_order smallint NOT NULL DEFAULT 1,
  "grouping" smallint NOT NULL DEFAULT 1,
  rule_created timestamp(0) without time zone NOT NULL DEFAULT now(),
  rule_updated timestamp without time zone,
  CONSTRAINT default_call_action_rule_pkey PRIMARY KEY (rule_id),
  CONSTRAINT call_action_rule_join_type_check CHECK (join_type::text = 'AND'::text OR join_type::text = 'OR'::text OR join_type::text = 'NONE'::text)
);

--4.Create table for Default Custom Source
CREATE TABLE public.default_custom_source
(
  org_unit_id integer NOT NULL,
  custom_source_name character varying(100) NOT NULL,
  custom_source_type custom_source_type NOT NULL DEFAULT 'CS1'::custom_source_type,
  custom_source_created timestamp without time zone NOT NULL DEFAULT now(),
  custom_source_active boolean NOT NULL DEFAULT true,
  CONSTRAINT default_custom_source_org_unit_id_fkey FOREIGN KEY (org_unit_id)
      REFERENCES public.org_unit (org_unit_id) MATCH SIMPLE
      ON UPDATE CASCADE ON DELETE CASCADE
);

--5.Create table for DNI
CREATE TABLE public.default_dni_setting
(
  org_unit_id integer NOT NULL,
  destination_url character varying(255),
  dni_type character varying(20),
  dni_element character varying(100),
  referrer character varying(255),
  referrer_type character varying(100),
  dni_active boolean NOT NULL DEFAULT true,
  last_verified timestamp(0) without time zone,
  dni_setting_created timestamp(0) without time zone NOT NULL DEFAULT now(),
  dni_setting_modified timestamp(0) without time zone,
  CONSTRAINT dni_setting_org_unit_id_fkey FOREIGN KEY (org_unit_id)
      REFERENCES public.dni_org_unit (org_unit_id) MATCH SIMPLE
      ON UPDATE CASCADE ON DELETE SET NULL
);
