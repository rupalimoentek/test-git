-- Create Table overflow_numbers
CREATE TABLE public.overflow_numbers(
overflow_number_id SERIAL NOT NULL,
provisioned_route_id INTEGER NOT NULL,
number_of_rings INTEGER,
created_by INTEGER NOT NULL,
created_on timestamp(0) with time zone NOT NULL DEFAULT now(),
updated_by INTEGER NOT NULL,
updated_on timestamp(0) with time zone NOT NULL DEFAULT now(),
CONSTRAINT overflow_number_id_pkey PRIMARY KEY (overflow_number_id),
CONSTRAINT overflow_number_provisioned_route_id_fkey FOREIGN KEY (provisioned_route_id)
REFERENCES public.provisioned_route (provisioned_route_id) MATCH SIMPLE
ON UPDATE CASCADE ON DELETE CASCADE
);

-- Grant Permission To overflow_numbers
GRANT ALL ON TABLE public.overflow_numbers TO interact;
GRANT SELECT ON TABLE public.overflow_numbers TO looker;

-- Add Fields in provisioned_route
-- 1. activate_voicemail
ALTER TABLE provisioned_route ADD COLUMN activate_voicemail BOOLEAN NOT NULL DEFAULT false;

-- CT-22017
-- 2. Add two fields in provisioned_route
ALTER TABLE provisioned_route ADD COLUMN is_dni_enabled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE provisioned_route ADD COLUMN is_post_call_ivr_enabled BOOLEAN NOT NULL DEFAULT false;

-- CT-18152
-- Create Table post_call_ivr_options
CREATE TABLE public.post_call_ivr_options(
post_call_ivr_option_id SERIAL NOT NULL,
post_call_ivr_option_name VARCHAR(100) NOT NULL,
created_by INTEGER NOT NULL,
created_on timestamp(0) with time zone NOT NULL DEFAULT now(),
updated_by INTEGER NOT NULL,
updated_on timestamp(0) with time zone NOT NULL DEFAULT now(),
CONSTRAINT post_call_ivr_option_id_pkey PRIMARY KEY (post_call_ivr_option_id)
);

-- Grant Permission To post_call_ivr_options
GRANT ALL ON TABLE public.post_call_ivr_options TO interact;
GRANT SELECT ON TABLE public.post_call_ivr_options TO looker;

-- Create Table post_call_ivr
CREATE TABLE public.post_call_ivr(
post_call_ivr_id SERIAL NOT NULL,
provisioned_route_id INTEGER NOT NULL,
post_call_ivr_option_id INTEGER NOT NULL,
created_by INTEGER NOT NULL,
created_on timestamp(0) with time zone NOT NULL DEFAULT now(),
updated_by INTEGER NOT NULL,
updated_on timestamp(0) with time zone NOT NULL DEFAULT now(),
deleted_by INTEGER,
deleted_on timestamp(0) with time zone,
CONSTRAINT post_call_ivr_id_pkey PRIMARY KEY (post_call_ivr_id),
CONSTRAINT post_call_ivr_provisioned_route_id_fkey FOREIGN KEY (provisioned_route_id)
REFERENCES public.provisioned_route (provisioned_route_id) MATCH SIMPLE
ON UPDATE CASCADE ON DELETE CASCADE,
CONSTRAINT post_call_ivr_option_id_fkey FOREIGN KEY (post_call_ivr_option_id)
REFERENCES public.post_call_ivr_options (post_call_ivr_option_id) MATCH SIMPLE
ON UPDATE CASCADE ON DELETE CASCADE
);

-- Grant Permission To post_call_ivr
GRANT ALL ON TABLE public.post_call_ivr TO interact;
GRANT SELECT ON TABLE public.post_call_ivr TO looker;

-- Create Table post_call_ivr_voice_prompts
CREATE TABLE public.default_post_call_ivr_voice_prompts(
post_call_ivr_voice_prompt_id SERIAL NOT NULL,
org_unit_id INTEGER NOT NULL,
voice_prompt voice_prompt NOT NULL DEFAULT 'record_agent_id'::voice_prompt,
voice_prompt_value TEXT,
number_of_digits INTEGER,
created_by INTEGER NOT NULL,
created_on timestamp(0) with time zone NOT NULL DEFAULT now(),
updated_by INTEGER NOT NULL,
updated_on timestamp(0) with time zone NOT NULL DEFAULT now(),
CONSTRAINT post_call_ivr_voice_prompt_id_pkey PRIMARY KEY (post_call_ivr_voice_prompt_id),
CONSTRAINT number_of_digits_check CHECK (number_of_digits> 0 AND number_of_digits <= '10'::INTEGER),
CONSTRAINT post_call_ivr_voice_prompts_org_unit_id_fkey FOREIGN KEY (org_unit_id)
REFERENCES public.org_unit (org_unit_id) MATCH SIMPLE
ON UPDATE CASCADE ON DELETE CASCADE
);

-- Telephony

-- Grant Permission To post_call_ivr_voice_prompts
GRANT ALL ON TABLE public.default_post_call_ivr_voice_prompts TO interact;
GRANT SELECT ON TABLE public.default_post_call_ivr_voice_prompts TO looker;

-- CT-25287
-- Add is_migrated in org_billing
ALTER TABLE org_billing ADD COLUMN is_migrated BOOLEAN NOT NULL DEFAULT false;

-- CT-25176
-- Create Table default_post_call_ivr_settings
CREATE TABLE public.default_post_call_ivr_settings(
org_unit_id INTEGER NOT NULL,
post_call_ivr_option_id INTEGER NOT NULL,
created_by INTEGER NOT NULL,
created_on timestamp(0) with time zone NOT NULL DEFAULT now(),
updated_by INTEGER NOT NULL,
updated_on timestamp(0) with time zone NOT NULL DEFAULT now(),
deleted_by INTEGER,
deleted_on timestamp(0) with time zone,
CONSTRAINT default_post_call_ivr_setting_org_unit_id_fkey FOREIGN KEY (org_unit_id)
REFERENCES public.org_unit (org_unit_id) MATCH SIMPLE
ON UPDATE CASCADE ON DELETE CASCADE,
CONSTRAINT default_post_call_ivr_option_id_fkey FOREIGN KEY (post_call_ivr_option_id)
REFERENCES public.post_call_ivr_options (post_call_ivr_option_id) MATCH SIMPLE
ON UPDATE CASCADE ON DELETE CASCADE
);

-- Grant Permission To default_post_call_ivr_settings
GRANT ALL ON TABLE public.default_post_call_ivr_settings TO interact;
GRANT SELECT ON TABLE public.default_post_call_ivr_settings TO looker;

-- Create Table default_advanced_org_unit_settings
CREATE TABLE public.default_advanced_org_unit_settings(
org_unit_id INTEGER NOT NULL,
ce_call_flow_recording_id INTEGER,
activate_voicemail BOOLEAN NOT NULL DEFAULT false,
voicemail_rings INTEGER NOT NULL DEFAULT 3,
overflow_rings INTEGER NOT NULL DEFAULT 3,
voicemail_greeting_message TEXT,
created_by INTEGER NOT NULL,
created_on timestamp(0) with time zone NOT NULL DEFAULT now(),
updated_by INTEGER NOT NULL,
updated_on timestamp(0) with time zone NOT NULL DEFAULT now(),
deleted_by INTEGER,
deleted_on timestamp(0) with time zone,
CONSTRAINT default_post_call_ivr_setting_org_unit_id_fkey FOREIGN KEY (org_unit_id)
REFERENCES public.org_unit (org_unit_id) MATCH SIMPLE
ON UPDATE CASCADE ON DELETE CASCADE,
CONSTRAINT ce_call_flow_recording_id_fkey FOREIGN KEY (ce_call_flow_recording_id)
REFERENCES public.ce_call_flow_recording (ce_call_flow_recording_id) MATCH SIMPLE
ON UPDATE CASCADE ON DELETE CASCADE,
CONSTRAINT voicemail_rings_check CHECK (voicemail_rings > 0 AND voicemail_rings <= '10'::INTEGER),
CONSTRAINT overflow_rings_check CHECK (overflow_rings > 0 AND overflow_rings <= '10'::INTEGER)
);

-- Grant Permission To default_post_call_ivr_settings
GRANT ALL ON TABLE public.default_advanced_org_unit_settings TO interact;
GRANT SELECT ON TABLE public.default_advanced_org_unit_settings TO looker;

-- Create table post_call_ivr_voice_prompts
CREATE TABLE public.post_call_ivr_voice_prompts (
post_call_ivr_voice_prompt_id SERIAL NOT NULL,
post_call_ivr_id integer NOT NULL,
voice_prompt voice_prompt NOT NULL DEFAULT 'record_agent_id'::voice_prompt,
voice_prompt_value text,
number_of_digits integer,
created_by integer NOT NULL,
created_on timestamp(0) with time zone NOT NULL DEFAULT now(),
updated_by integer NOT NULL,
updated_on timestamp(0) with time zone NOT NULL DEFAULT now(),
CONSTRAINT postcall_ivr_id_pkey PRIMARY KEY (post_call_ivr_voice_prompt_id),
CONSTRAINT post_call_ivr_id_fkey FOREIGN KEY (post_call_ivr_id)
REFERENCES public.post_call_ivr (post_call_ivr_id) MATCH SIMPLE
ON UPDATE CASCADE ON DELETE CASCADE,
CONSTRAINT number_of_digits_check CHECK (number_of_digits > 0 AND number_of_digits <= 10)
);

-- Grant permission to post_call_ivr_voice_prompts
GRANT ALL ON TABLE public.post_call_ivr_voice_prompts TO interact;
GRANT SELECT ON TABLE public.post_call_ivr_voice_prompts TO looker;

ALTER TABLE post_call_ivr ADD COLUMN status VARCHAR(10);

-- Alter table phone_detail to add new column is_routed as boolean default false
ALTER TABLE phone_detail ADD COLUMN is_routed BOOLEAN DEFAULT false;

-- Alter table default_org_setting
ALTER TABLE default_org_setting ADD COLUMN is_dni_enabled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE default_org_setting ADD COLUMN is_post_call_ivr_enabled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE phone_pool ADD COLUMN status phone_pool_status NOT NULL DEFAULT 'active';

-- Modify phone_pool table

-- 1. Drop columns pool_pr_id, pool_ou_id
ALTER TABLE phone_pool DROP COLUMN pool_pr_id;
ALTER TABLE phone_pool DROP COLUMN pool_ou_id;

-- 2. change datatype of keep_alive_mins to integer
ALTER TABLE phone_pool ALTER COLUMN keep_alive_mins TYPE INTEGER;

-- 3. change datatype of pool_created
ALTER TABLE phone_pool ALTER COLUMN pool_created TYPE timestamp(0) without time zone;

-- Restart sequence value with 1
ALTER SEQUENCE phone_pool_pool_id_seq RESTART WITH 1;
ALTER TABLE call_detail ADD COLUMN hunt_type hunt_types;
ALTER TABLE provisioned_route ADD COLUMN hunt_type hunt_types;

CREATE TABLE public.location_ivr_route (
location_ivr_route_id serial not null,
message VARCHAR(250),
repeat_greeting boolean DEFAULT false,
CONSTRAINT location_ivr_routes_pkey PRIMARY KEY (location_ivr_route_id)
);

GRANT ALL ON TABLE public.location_ivr_route TO interact;
GRANT SELECT ON TABLE public.location_ivr_route TO looker;

CREATE TABLE public.location_ivr_option (
location_ivr_option_id SERIAL NOT NULL,
location_ivr_route_id INTEGER,
value integer,
target_did character varying(255) DEFAULT NULL::character varying,
ouid integer,
email_to_notify character varying(255) DEFAULT NULL::character varying,
play_disclaimer character varying(255) DEFAULT 'never'::character varying,
message character varying(255) DEFAULT 'blank://'::character varying,
whisper_message character varying(255) DEFAULT NULL::character varying,
created_at character varying(20) DEFAULT NULL::character varying,
updated_at character varying(20) DEFAULT NULL::character varying,
level integer DEFAULT 0,
parentid integer DEFAULT 0,
webhook_enabled boolean DEFAULT false,
message_enabled boolean DEFAULT false,
record_enabled boolean DEFAULT false,
whisper_enabled boolean DEFAULT false,
vm_enabled boolean DEFAULT false,
key_press INTEGER,
hunt_option_id integer,
ivr_option_type ivr_option_type NOT NULL DEFAULT 'simple'::ivr_option_type,
destination character varying(100),
back_press INTEGER,
CONSTRAINT location_ivr_options_pkey PRIMARY KEY (location_ivr_option_id),
CONSTRAINT location_ivr_route_id_fkey FOREIGN KEY (location_ivr_route_id)
REFERENCES public.location_ivr_route (location_ivr_route_id) MATCH SIMPLE
ON UPDATE CASCADE ON DELETE CASCADE
);

GRANT ALL ON TABLE public.location_ivr_option TO interact;
GRANT SELECT ON TABLE public.location_ivr_option TO looker;

ALTER TABLE location_route ADD COLUMN location_ivr_route_id INTEGER;
ALTER TABLE location_route ADD CONSTRAINT location_ivr_route_id_fkey FOREIGN KEY(location_ivr_route_id) REFERENCES public.location_ivr_route(location_ivr_route_id)
MATCH SIMPLE ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE ce_geo_routes ALTER COLUMN radius TYPE VARCHAR(8);

CREATE OR REPLACE VIEW public.ce_all_geo_routes AS
SELECT ce_geo_routes.id,
ce_geo_options.target_did,
ce_geo_options.ouid,
ce_geo_options.address,
ce_geo_options.city,
ce_geo_options.latitude,
ce_geo_options.longitude,
ce_geo_routes.radius
FROM ce_geo_options
JOIN ce_geo_routes ON ce_geo_options.geo_route_id = ce_geo_routes.id;

CREATE OR REPLACE RULE get_pkey_on_insert_location_ivr_route AS
ON INSERT TO location_ivr_route DO SELECT currval('location_ivr_route_location_ivr_route_id_seq'::text::regclass) AS id;

CREATE TABLE public.post_call_ivr_responses(
post_call_ivr_response_id SERIAL NOT NULL,
call_id INTEGER NOT NULL,
agent_id INTEGER,
sales VARCHAR(50),
lead VARCHAR(50),
created_by INTEGER NOT NULL,
created_on timestamp(0) with time zone NOT NULL DEFAULT now(),
updated_by INTEGER NOT NULL,
updated_on timestamp(0) with time zone NOT NULL DEFAULT now(),
CONSTRAINT post_call_ivr_response_id_pkey PRIMARY KEY (post_call_ivr_response_id),
CONSTRAINT call_id_post_call_ivr_responses_ukey UNIQUE (call_id),
CONSTRAINT call_id_fkey FOREIGN KEY (call_id)
REFERENCES public.call (call_id) MATCH SIMPLE
ON UPDATE CASCADE ON DELETE CASCADE
);

GRANT ALL ON TABLE public.post_call_ivr_responses TO interact;
GRANT SELECT ON TABLE public.post_call_ivr_responses TO looker;

ALTER TABLE public.call_detail ADD COLUMN tracking_type VARCHAR(50) default null;
ALTER TABLE location_route ADD COLUMN location_route_claimed_states VARCHAR(200);
ALTER TABLE call_detail ADD COLUMN is_voicemail BOOLEAN DEFAULT FALSE;

CREATE TABLE public.multilevel_keys (
call_id bigint NOT NULL,
key_path TEXT NOT NULL,
is_abundant_call BOOLEAN NOT NULL DEFAULT false,
CONSTRAINT call_detail_call_id_fkey FOREIGN KEY (call_id)
REFERENCES public.call (call_id) MATCH SIMPLE
ON UPDATE CASCADE ON DELETE CASCADE
);

GRANT ALL ON TABLE public.multilevel_keys TO interact;
GRANT SELECT ON TABLE public.multilevel_keys TO looker;

ALTER TABLE provisioned_route ADD COLUMN orphan_path TEXT;

CREATE TABLE public.multilevel_keys_orphan_path (
provisioned_route_id integer NOT NULL,
orphan_path text NOT NULL,
created_by integer NOT NULL,
created_on timestamp(0) with time zone NOT NULL DEFAULT now(),
updated_by integer NOT NULL,
updated_on timestamp(0) with time zone NOT NULL DEFAULT now(),
location_route_id integer,
CONSTRAINT provisioned_route_id_fkey FOREIGN KEY (provisioned_route_id)
REFERENCES public.provisioned_route (provisioned_route_id) MATCH SIMPLE
ON UPDATE CASCADE ON DELETE CASCADE
);
GRANT ALL ON TABLE public.multilevel_keys_orphan_path TO interact;
GRANT SELECT ON TABLE public.multilevel_keys_orphan_path TO looker;

ALTER TABLE public.location ALTER COLUMN location_created TYPE timestamp(0) with time zone;
ALTER TABLE public.location ALTER COLUMN location_created SET DEFAULT now();

UPDATE public.location SET location_created = now() where location_created IS null;

ALTER TABLE public.location ALTER COLUMN location_created SET NOT NULL;
ALTER TABLE public.location ALTER COLUMN location_modified TYPE timestamp(0) with time zone;
ALTER TABLE public.location ALTER COLUMN location_modified SET DEFAULT now();

ALTER TABLE public.ce_hunt_types ADD COLUMN provisioned_route_id INTEGER;
ALTER TABLE public.ce_hunt_types ADD CONSTRAINT provisioned_route_id_fkey FOREIGN KEY (provisioned_route_id) REFERENCES provisioned_route (provisioned_route_id);

ALTER TABLE public.call_detail ADD COLUMN menu_time time NULL;

ALTER TYPE hunt_types ADD VALUE '';

CREATE TABLE public.old_reports
(
report_id integer,
report_name text,
report_description text,
looker_id integer,
is_default boolean,
is_deleted boolean,
report_ous integer[],
ca_looker_id integer,
is_admin_only boolean,
access access_types,
component_id integer
);

ALTER TABLE public.old_reports OWNER TO interact;

GRANT ALL ON TABLE public.old_reports TO interact;
GRANT SELECT ON TABLE public.old_reports TO looker;

ALTER TABLE public.post_call_ivr ADD COLUMN post_call_ivr_status status;
ALTER TABLE public.post_call_ivr ALTER COLUMN post_call_ivr_status SET NOT NULL;
ALTER TABLE public.post_call_ivr ALTER COLUMN post_call_ivr_status SET DEFAULT 'active'::status;

CREATE OR REPLACE RULE get_pkey_on_insert AS
ON INSERT TO post_call_ivr DO SELECT currval('post_call_ivr_post_call_ivr_id_seq'::text::regclass) AS post_call_ivr_id;

CREATE TABLE public.sp_call(
sp_call_id character varying(20),
org_unit_id integer NOT NULL,
call_started timestamp(0) with time zone NOT NULL,
sp_call_data json
);

ALTER TABLE public.sp_call OWNER TO interact;
ALTER TYPE cdr ADD VALUE 'SP' AFTER 'CE';
ALTER TABLE phone_pool_number DROP COLUMN number_id;

CREATE TABLE public.looker_schedule_options (
id SERIAL NOT NULL,
schedule_route_id integer,
ce_hunt_type_id integer,
target_did character varying(255) DEFAULT NULL::character varying,
days text[] NOT NULL,
from_time time without time zone NOT NULL DEFAULT now(),
to_time time without time zone NOT NULL DEFAULT now(),
created_at timestamp(0) without time zone NOT NULL DEFAULT now(),
updated_at timestamp(0) without time zone NOT NULL DEFAULT now(),
vm_enabled boolean,
CONSTRAINT looker_schedule_options_pkey PRIMARY KEY (id),
CONSTRAINT schedule_route_id_fkey FOREIGN KEY (schedule_route_id)
REFERENCES public.ce_schedule_routes (id) MATCH SIMPLE
ON UPDATE CASCADE ON DELETE CASCADE
);

GRANT ALL ON TABLE public.looker_schedule_options TO interact;
GRANT SELECT ON TABLE public.looker_schedule_options TO looker;

-- Given By Pravin  
ALTER TABLE location ALTER COLUMN location_modified DROP DEFAULT;

-- Given by Pravin - 26th August [Migration Status [Callflows And Number pool only]
ALTER TABLE call ADD COLUMN location_route_id int default null;
ALTER TYPE phone_pool_status ADD VALUE 'referral' AFTER 'deleted';
ALTER TABLE location_ivr_option ADD COLUMN action_order integer;

CREATE OR REPLACE RULE get_pkey_on_insert_location_ivr_option AS ON INSERT TO location_ivr_option DO SELECT currval('location_ivr_option_location_ivr_option_id_seq'::text::regclass) AS id;



--- create view for pg
create or replace view ce_all_geo_routes as (
SELECT ce_geo_routes.id,
location_route.location_route_target::character varying(255) AS target_did,
location.org_unit_id AS ouid,
location_route.location_route_address::character varying(255) AS address,
location_route.location_route_city::character varying(255) AS city,
location_route.location_route_latitude::character varying(20) AS latitude,
location_route.location_route_longitude::character varying(20) AS longitude,
ce_geo_routes.radius,
location_route.location_ivr_route_id,
location_route.location_route_id,
location.location_active,
location_route.location_route_active
FROM location
JOIN ce_geo_routes ON location.location_id = ce_geo_routes.location_id
JOIN location_route ON location.location_id = location_route.location_id );



-- used to allow for all ce3 like geo sql in SP
-- create functions for pg

create or replace function ce_distance_alternate("lat1" double precision, "lon1" double precision, "lat2" double precision, "lon2" double precision) returns double precision as $$
DECLARE earth_radius_miles INT;
BEGIN

earth_radius_miles := 3959;

RETURN earth_radius_miles * ACOS(
COS(RADIANS(lat1)) * COS(RADIANS(lat2)) *
COS(RADIANS(lon2) - RADIANS(lon1)) +
SIN(RADIANS(lat1)) * SIN(RADIANS(lat2))
);
END;

$$ LANGUAGE plpgsql;


create or replace function ce_distance("lat1" double precision, "lon1" double precision, "lat2" double precision, "lon2" double precision) returns double precision as $$
DECLARE earth_radius_km INT;
earth_radius_miles INT;
degrees_to_radians DOUBLE PRECISION;
BEGIN

earth_radius_km := 6371;
earth_radius_miles := 3959;
degrees_to_radians := 57.29577951;

RETURN (earth_radius_miles * ACOS((SIN(lat1 / degrees_to_radians) * SIN(lat2 / degrees_to_radians)) +
(COS(lat1 / degrees_to_radians) *
COS(lat2 / degrees_to_radians) *
COS(lon2 / degrees_to_radians - lon1 / degrees_to_radians))));
END;
$$ LANGUAGE plpgsql;



ALTER TABLE phone_pool_number ADD COLUMN vendor_id integer;
ALTER TABLE phone_pool_number
ADD CONSTRAINT phone_pool_number_vendor_id_fkey FOREIGN KEY (vendor_id)
REFERENCES public.phone_vendor (vendor_id) MATCH SIMPLE
ON UPDATE CASCADE ON DELETE CASCADE;