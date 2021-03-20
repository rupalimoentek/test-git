-- CE Database changes (to be applied at the newcallengine_env database)
ALTER TABLE newcallengine_stag.geo_routes ADD COLUMN default_ringto int default null;

-- CFA PG Database changes (to be applied at the ct_env database)

-- Create ENUM voice_prompts
CREATE TYPE voice_prompt AS ENUM ('record_agent_id', 'record_call_outcome', 'record_a_sale', 'record_a_lead');

-- Add new enum type as VOICEMAIL
ALTER TYPE disposition_type ADD VALUE 'VOICEMAIL' AFTER 'HANGUP';

-- Add new enum type as CALLER HANGUP
ALTER TYPE disposition_type ADD VALUE 'CALLER HANGUP' AFTER 'VOICEMAIL';

-- Add new enum as phone_pool_status and add status column in phone_pool table
CREATE TYPE phone_pool_status AS ENUM ('active', 'inactive', 'deleted');

-- Add enum as hunt_types
CREATE TYPE hunt_types AS ENUM ('overflow','rollover','simultaneous');

CREATE TYPE ivr_option_type AS ENUM ('simple', 'geo', 'interactiveVoice');

---------------------------------------------------------------------------------------------------------------------------------
CREATE TABLE public.ce_blacklist(
"number" character varying(20),
action character varying(20) DEFAULT 'block'::character varying,
data character varying(20),
call_flow_id integer,
org_unit_id integer,
billing_id integer,
num_ou_id integer,
app_id character varying(10),
dnis character varying(10),
by_billing_id integer,
status smallint DEFAULT 1,
id SERIAL NOT NULL
);

GRANT ALL ON TABLE public.ce_blacklist TO interact;
GRANT SELECT ON TABLE public.ce_blacklist TO looker;                                                                                                                                         
                                                                                                                                                                                            
CREATE INDEX ce_blacklist_billing_id_idx                                                                                                                                                     
ON public.ce_blacklist                                                                                                                                                                       
USING btree
(billing_id);

CREATE INDEX ce_blacklist_number_idx
ON public.ce_blacklist
USING btree
(number COLLATE pg_catalog."default");

CREATE INDEX ce_blacklist_ouid_idx
ON public.ce_blacklist
USING btree
(org_unit_id);

CREATE TABLE public.ce_call_flow_recording (
ce_call_flow_recording_id SERIAL NOT NULL,
ce_call_flow_recording_ou_id integer,
ce_call_flow_recording_filename character varying(50),
ce_call_flow_recording_name character varying(50),
ce_call_flow_recording_type character varying(10),
ce_call_flow_recording_created timestamp(0) with time zone NOT NULL DEFAULT now(),
ce_call_flow_recording_modified timestamp(0) with time zone NOT NULL DEFAULT now(),
ce_recording_active boolean NOT NULL DEFAULT true,
created_by integer NOT NULL,
created_on timestamp(0) with time zone NOT NULL DEFAULT now(),
updated_by integer NOT NULL,
updated_on timestamp(0) with time zone NOT NULL DEFAULT now(),
CONSTRAINT ce_call_flow_recording_id_pkey PRIMARY KEY (ce_call_flow_recording_id),
CONSTRAINT ce_call_flow_recording_ou_id_fkey FOREIGN KEY (ce_call_flow_recording_ou_id)
REFERENCES public.org_unit (org_unit_id) MATCH SIMPLE
ON UPDATE CASCADE ON DELETE CASCADE
);

GRANT ALL ON TABLE public.ce_call_flow_recording TO interact;
GRANT SELECT ON TABLE public.ce_call_flow_recording TO looker;

CREATE TABLE public.ce_call_flows (
id SERIAL NOT NULL,
provisioned_route_id integer,
dnis character varying(20) DEFAULT NULL::character varying,
message character varying(255) DEFAULT NULL::character varying,
default_ringto character varying(255) DEFAULT NULL::character varying,
ouid integer,
caller_to_sms character varying(1024) DEFAULT NULL::character varying,
email_to_notify character varying(255) DEFAULT NULL::character varying,
play_disclaimer character varying(255) DEFAULT NULL::character varying,
created_at character varying(20) DEFAULT NULL::character varying,
updated_at character varying(50) DEFAULT NULL::character varying,
country_code character varying(10) DEFAULT NULL::character varying,
tx_boost integer,
rx_boost integer,
routable_type character varying(255) DEFAULT NULL::character varying,
routable_id integer,
status character varying(50) DEFAULT NULL::character varying,
record_until character varying(20) DEFAULT NULL::character varying,
whisper_message character varying(255) DEFAULT NULL::character varying,
app_id character varying(20) DEFAULT NULL::character varying,
spam_ivr integer,
ring_delay integer,
postcall_ivr_id integer,
spam_threshold integer,
referral_number character varying(20) DEFAULT NULL::character varying,
referral_date character varying(50) DEFAULT NULL::character varying,
toggle_rec integer,
cid_spoof character varying(10) DEFAULT NULL::character varying,
hunt_option integer DEFAULT 0,
vm_message text,
message_enabled boolean DEFAULT false,
vm_enabled boolean DEFAULT false,
whisper_enabled boolean DEFAULT false,
webhook_enabled boolean DEFAULT false,
dnis_as_cid boolean DEFAULT false,
postcall_ivr_enabled boolean DEFAULT false,
spam_filter_enabled boolean DEFAULT false,
CONSTRAINT ce_call_flows_pkey PRIMARY KEY (id)
);

GRANT ALL ON TABLE public.ce_call_flows TO interact;
GRANT SELECT ON TABLE public.ce_call_flows TO looker;

CREATE INDEX ce_call_flows_dnis_idx
ON public.ce_call_flows
USING btree
(dnis COLLATE pg_catalog."default");

CREATE INDEX ce_call_flows_ouid_idx
ON public.ce_call_flows
USING btree
(ouid);

CREATE OR REPLACE RULE get_pkey_on_insert_ce_call_flows AS ON INSERT TO ce_call_flows DO SELECT currval('ce_call_flows_id_seq'::text::regclass) AS id;

CREATE TABLE public.ce_event_types (
id SERIAL NOT NULL,
event_name character varying(80) DEFAULT NULL::character varying,
CONSTRAINT ce_event_types_pkey PRIMARY KEY (id)
);

GRANT ALL ON TABLE public.ce_event_types TO interact;
GRANT SELECT ON TABLE public.ce_event_types TO looker;

CREATE INDEX ce_event_types_event_name_idx
ON public.ce_event_types
USING btree
(event_name COLLATE pg_catalog."default");

CREATE OR REPLACE RULE get_pkey_on_insert_ce_event_types AS ON INSERT TO ce_event_types DO SELECT currval('ce_event_types_id_seq'::text::regclass) AS id;

CREATE TABLE public.ce_events (
id SERIAL NOT NULL,
event_type_id integer,
event_timestamp timestamp without time zone DEFAULT now(),
event_user character varying(80) DEFAULT NULL::character varying,
event_data character varying(80) DEFAULT NULL::character varying,
event_log character varying(80) DEFAULT NULL::character varying,
event_processed smallint DEFAULT 0,
CONSTRAINT ce_events_pkey PRIMARY KEY (id)
);

GRANT ALL ON TABLE public.ce_events TO interact;
GRANT SELECT ON TABLE public.ce_events TO looker;

CREATE INDEX ce_events_data_idx
ON public.ce_events
USING btree
(event_data COLLATE pg_catalog."default");

CREATE INDEX ce_events_user_idx
ON public.ce_events
USING btree
(event_user COLLATE pg_catalog."default");

CREATE OR REPLACE RULE get_pkey_on_insert_ce_events AS ON INSERT TO ce_events DO SELECT currval('ce_events_id_seq'::text::regclass) AS id;

CREATE TABLE public.ce_geo_claimed_zip (
id SERIAL NOT NULL,
geo_route_id integer,
target_did character varying(10),
zipcode character varying(2000),
ouid integer,
comment character varying(80),
city character varying(80),
address character varying(80),
default_ringto character varying(20) DEFAULT NULL::character varying,
CONSTRAINT ce_geo_claimed_zip_pkey PRIMARY KEY (id)
);

GRANT ALL ON TABLE public.ce_geo_claimed_zip TO interact;
GRANT SELECT ON TABLE public.ce_geo_claimed_zip TO looker;

CREATE INDEX ce_geo_claimed_zip_ouid_idx
ON public.ce_geo_claimed_zip
USING btree
(ouid);

CREATE INDEX ce_geo_claimed_zip_target_idx
ON public.ce_geo_claimed_zip
USING btree
(target_did COLLATE pg_catalog."default");

CREATE OR REPLACE RULE get_pkey_on_insert_ce_geo_claimed_zip AS
ON INSERT TO ce_geo_claimed_zip DO SELECT currval('ce_geo_claimed_zip_id_seq'::text::regclass) AS id;

CREATE TABLE public.ce_geo_lookup (
npa character varying(3),
nxx character varying(3),
zip character varying(5),
state character varying(2),
city character varying(128),
rc character varying(10),
latitude double precision,
longitude double precision
);

GRANT ALL ON TABLE public.ce_geo_lookup TO interact;
GRANT SELECT ON TABLE public.ce_geo_lookup TO looker;

CREATE INDEX ce_geo_lookup_city_idx
ON public.ce_geo_lookup
USING btree
(city COLLATE pg_catalog."default");

CREATE INDEX ce_geo_lookup_npa_idx
ON public.ce_geo_lookup
USING btree
(npa COLLATE pg_catalog."default");

CREATE INDEX ce_geo_lookup_nxx_idx
ON public.ce_geo_lookup
USING btree
(nxx COLLATE pg_catalog."default");

CREATE INDEX ce_geo_lookup_rc_idx
ON public.ce_geo_lookup
USING btree
(rc COLLATE pg_catalog."default");

CREATE INDEX ce_geo_lookup_zip_idx
ON public.ce_geo_lookup
USING btree
(zip COLLATE pg_catalog."default");

CREATE TABLE public.ce_geo_options(
id SERIAL NOT NULL,
geo_route_id integer,
target_did character varying(255) DEFAULT NULL::character varying,
ouid integer,
latitude character varying(20) DEFAULT NULL::character varying,
longitude character varying(20) DEFAULT NULL::character varying,
address character varying(255) DEFAULT NULL::character varying,
city character varying(255) DEFAULT NULL::character varying,
created_at timestamp(0) without time zone DEFAULT now(),
updated_at timestamp(0) without time zone DEFAULT now(),
default_ringto character varying(20) DEFAULT NULL::character varying,
CONSTRAINT ce_geo_options_pkey PRIMARY KEY (id)
);

GRANT ALL ON TABLE public.ce_geo_options TO interact;
GRANT SELECT ON TABLE public.ce_geo_options TO looker;

CREATE INDEX ce_geo_options_ouid_idx
ON public.ce_geo_options
USING btree
(ouid);

CREATE INDEX ce_geo_options_target_idx
ON public.ce_geo_options
USING btree
(target_did COLLATE pg_catalog."default");

CREATE OR REPLACE RULE get_pkey_on_insert_ce_geo_options AS ON INSERT TO ce_geo_options DO SELECT currval('ce_geo_options_id_seq'::text::regclass) AS id;

CREATE TABLE public.ce_geo_routes (
id SERIAL NOT NULL,
strategy character varying(30) DEFAULT 'Zipcode'::character varying,
play_branding boolean DEFAULT false,
allow_manual_entry boolean DEFAULT false,
radius character varying(8),
location_id integer,
default_ringto character varying(20) DEFAULT NULL::character varying,
CONSTRAINT ce_geo_routes_pkey PRIMARY KEY (id)
);

GRANT ALL ON TABLE public.ce_geo_routes TO interact;
GRANT SELECT ON TABLE public.ce_geo_routes TO looker;

CREATE OR REPLACE RULE get_pkey_on_insert_ce_geo_routes AS ON INSERT TO ce_geo_routes DO SELECT currval('ce_geo_routes_id_seq'::text::regclass) AS id;

CREATE TABLE public.ce_greetings(
id SERIAL NOT NULL,
target_number character varying(255) DEFAULT NULL::character varying,
filename character varying(255) DEFAULT NULL::character varying,
saved smallint,
created_at character varying(20),
updated_at character varying(20),
CONSTRAINT ce_greetings_pkey PRIMARY KEY (id)
);

GRANT ALL ON TABLE public.ce_greetings TO interact;
GRANT SELECT ON TABLE public.ce_greetings TO looker;

CREATE INDEX ce_greetings_filename_idx
ON public.ce_greetings
USING btree
(filename COLLATE pg_catalog."default");

CREATE INDEX ce_greetings_target_number_idx
ON public.ce_greetings
USING btree
(target_number COLLATE pg_catalog."default");

CREATE OR REPLACE RULE get_pkey_on_insert_ce_greetings AS ON INSERT TO ce_greetings DO SELECT currval('ce_greetings_id_seq'::text::regclass) AS id;

CREATE TABLE public.ce_hunt_options (
id SERIAL NOT NULL,
target_did character varying(20),
ring_delay integer DEFAULT 18,
ouid integer,
lastcall timestamp without time zone,
hunt_route_id integer,
overflow_order smallint DEFAULT 0,
CONSTRAINT ce_hunt_options_pkey PRIMARY KEY (id)
);

GRANT ALL ON TABLE public.ce_hunt_options TO interact;
GRANT SELECT ON TABLE public.ce_hunt_options TO looker;

CREATE INDEX ce_hunt_options_ouid_idx
ON public.ce_hunt_options
USING btree
(ouid);

CREATE INDEX ce_hunt_options_target_idx
ON public.ce_hunt_options
USING btree
(target_did COLLATE pg_catalog."default");

CREATE OR REPLACE RULE get_pkey_on_insert_ce_hunt_options AS ON INSERT TO ce_hunt_options DO SELECT currval('ce_hunt_options_id_seq'::text::regclass) AS id;

CREATE TABLE public.ce_hunt_types (
id SERIAL NOT NULL,
hunt_type character varying(20),
retry_count integer DEFAULT 0,
CONSTRAINT ce_hunt_types_pkey PRIMARY KEY (id)
);

GRANT ALL ON TABLE public.ce_hunt_types TO interact;
GRANT SELECT ON TABLE public.ce_hunt_types TO looker;

CREATE OR REPLACE RULE get_pkey_on_insert_ce_hunt_types AS ON INSERT TO ce_hunt_types DO SELECT currval('ce_hunt_types_id_seq'::text::regclass) AS id;

CREATE TABLE public.ce_ivr_options(
id SERIAL NOT NULL,
target_did character varying(255) DEFAULT NULL::character varying,
ouid integer,
value integer,
created_at character varying(20) DEFAULT NULL::character varying,
updated_at character varying(20) DEFAULT NULL::character varying,
ivr_route_id integer,
message_enabled smallint DEFAULT 0,
message character varying(255) DEFAULT NULL::character varying,
CONSTRAINT ce_ivr_options_pkey PRIMARY KEY (id)
);

GRANT ALL ON TABLE public.ce_ivr_options TO interact;
GRANT SELECT ON TABLE public.ce_ivr_options TO looker;

CREATE INDEX ce_ivr_options_ouid_idx
ON public.ce_ivr_options
USING btree
(ouid);

CREATE INDEX ce_ivr_options_target_idx
ON public.ce_ivr_options
USING btree
(target_did COLLATE pg_catalog."default");

CREATE OR REPLACE RULE get_pkey_on_insert_ce_ivr_options AS ON INSERT TO ce_ivr_options DO SELECT currval('ce_ivr_options_id_seq'::text::regclass) AS id;

CREATE TABLE public.ce_ivr_options2 (
id SERIAL NOT NULL,
ivr_route_id integer,
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
key_press integer DEFAULT 0,
hunt_option_id integer,
ivr_option_type ivr_option_type NOT NULL DEFAULT 'simple'::ivr_option_type,
destination character varying(100),
back_press integer,
action_order integer,
CONSTRAINT ce_ivr_options2_pkey PRIMARY KEY (id)
);

CREATE INDEX ce_ivr_options2_ouid_idx
ON public.ce_ivr_options2
USING btree
(ouid);

CREATE INDEX ce_ivr_options2_target_idx
ON public.ce_ivr_options2
USING btree
(target_did COLLATE pg_catalog."default");

CREATE OR REPLACE RULE get_pkey_on_insert_ce_ivr_options2 AS ON INSERT TO ce_ivr_options2 DO SELECT currval('ce_ivr_options2_id_seq'::text::regclass) AS id;

CREATE TABLE public.ce_ivr_routes (
id SERIAL NOT NULL,
repeat_greeting smallint DEFAULT 0,
CONSTRAINT ce_ivr_routes_pkey PRIMARY KEY (id)
);

GRANT ALL ON TABLE public.ce_ivr_routes TO interact;
GRANT SELECT ON TABLE public.ce_ivr_routes TO looker;

CREATE OR REPLACE RULE get_pkey_on_insert_ce_ivr_routes AS ON INSERT TO ce_ivr_routes DO SELECT currval('ce_ivr_routes_id_seq'::text::regclass) AS id;

CREATE TABLE public.ce_ivr_routes2 (
id SERIAL NOT NULL,
repeat_greeting boolean DEFAULT false,
CONSTRAINT ce_ivr_routes2_pkey PRIMARY KEY (id)
);

GRANT ALL ON TABLE public.ce_ivr_routes2 TO interact;
GRANT SELECT ON TABLE public.ce_ivr_routes2 TO looker;

CREATE OR REPLACE RULE get_pkey_on_insert_ce_ivr_routes2 AS ON INSERT TO ce_ivr_routes2 DO SELECT currval('ce_ivr_routes2_id_seq'::text::regclass) AS id;

CREATE TABLE public.ce_npanxx (
npa character varying(3) NOT NULL DEFAULT ''::character varying,
nxx character varying(3) NOT NULL DEFAULT ''::character varying,
block_id character varying(1) NOT NULL,
tbp_ind character varying(1) DEFAULT NULL::character varying,
lata character varying(5) DEFAULT NULL::character varying,
ltype character varying(1) DEFAULT NULL::character varying,
contam character varying(1) DEFAULT NULL::character varying,
state character varying(2) DEFAULT NULL::character varying,
country character varying(2) DEFAULT NULL::character varying,
wcold character varying(128) DEFAULT NULL::character varying,
switch character varying(11) DEFAULT NULL::character varying,
rcstatus character varying(2) DEFAULT NULL::character varying,
rctype character varying(1) DEFAULT NULL::character varying,
wc character varying(10) DEFAULT NULL::character varying,
tz character varying(2) DEFAULT NULL::character varying,
dst character varying(1) DEFAULT NULL::character varying,
zip character varying(5) DEFAULT NULL::character varying,
zip2 character varying(5) DEFAULT NULL::character varying,
zip3 character varying(5) DEFAULT NULL::character varying,
zip4 character varying(5) DEFAULT NULL::character varying,
fips character varying(5) DEFAULT NULL::character varying,
fips2 character varying(5) DEFAULT NULL::character varying,
fips3 character varying(5) DEFAULT NULL::character varying,
cbsa character varying(5) DEFAULT NULL::character varying,
cbsa2 character varying(5) DEFAULT NULL::character varying,
msa character varying(4) DEFAULT NULL::character varying,
pmsa character varying(4) DEFAULT NULL::character varying,
latitude double precision NOT NULL DEFAULT '0'::double precision,
longitude double precision NOT NULL DEFAULT '0'::double precision,
ocn_category character varying(1) DEFAULT NULL::character varying,
ocn character varying(4) DEFAULT NULL::character varying,
derived_from_npa character varying(3) DEFAULT NULL::character varying,
newnpa character varying(20) DEFAULT NULL::character varying,
"overlay" character varying(1) DEFAULT NULL::character varying
);

GRANT ALL ON TABLE public.ce_npanxx TO interact;
GRANT SELECT ON TABLE public.ce_npanxx TO looker;

CREATE INDEX ce_npanxx_npa_idx
ON public.ce_npanxx
USING btree
(npa COLLATE pg_catalog."default");

CREATE INDEX ce_npanxx_nxx_idx
ON public.ce_npanxx
USING btree
(nxx COLLATE pg_catalog."default");

CREATE TABLE public.ce_outbound_routes(
id SERIAL NOT NULL,
pin character varying(4),
callerid character varying(20) DEFAULT NULL::character varying,
disclaimer boolean DEFAULT false,
prompt boolean DEFAULT false,
CONSTRAINT ce_outbound_routes_pkey PRIMARY KEY (id)
);

GRANT ALL ON TABLE public.ce_outbound_routes TO interact;
GRANT SELECT ON TABLE public.ce_outbound_routes TO looker;

CREATE OR REPLACE RULE get_pkey_on_insert_ce_outbound_routes AS ON INSERT TO ce_outbound_routes DO SELECT currval('ce_outbound_routes_id_seq'::text::regclass) AS id;

CREATE TABLE public.ce_percentage_route (
id SERIAL NOT NULL,
CONSTRAINT ce_percentage_route_pkey PRIMARY KEY (id)
);

GRANT ALL ON TABLE public.ce_percentage_route TO interact;
GRANT SELECT ON TABLE public.ce_percentage_route TO looker;

CREATE OR REPLACE RULE get_pkey_on_insert AS ON INSERT TO ce_percentage_route DO SELECT max(ce_percentage_route_id.id) AS max FROM ce_percentage_route ce_percentage_route_id;

CREATE TABLE public.ce_percentage_route_options (
id SERIAL NOT NULL,
percentage_route_id integer,
percentage integer DEFAULT 100,
target_did character varying(80) DEFAULT NULL::character varying,
ce_hunt_type_id integer,
vm_enabled boolean DEFAULT false,
route_order integer,
modified timestamp(0) with time zone,
CONSTRAINT ce_percentage_route_options_pkey PRIMARY KEY (id),
CONSTRAINT ce_hunt_type_id_fkey FOREIGN KEY (ce_hunt_type_id)
REFERENCES public.ce_hunt_types (id) MATCH SIMPLE
ON UPDATE NO ACTION ON DELETE NO ACTION
);

GRANT ALL ON TABLE public.ce_percentage_route_options TO interact;
GRANT SELECT ON TABLE public.ce_percentage_route_options TO looker;

CREATE INDEX ce_percentage_route_options_target_did_idx
ON public.ce_percentage_route_options
USING btree
(target_did COLLATE pg_catalog."default");

CREATE OR REPLACE RULE get_pkey_on_insert_ce_percentage_route_options AS ON INSERT TO ce_percentage_route_options DO SELECT currval('ce_percentage_route_options_id_seq'::text::regclass) AS
id;

CREATE TABLE public.ce_postcall_ivr (
id SERIAL NOT NULL,
postcall_ivr_greeting character varying(255) DEFAULT NULL::character varying,
postcall_ivr_min_digits integer DEFAULT 0,
postcall_ivr_max_digits integer DEFAULT 10,
postcall_ivr_regex character varying(255) DEFAULT '^([0-9]+)$'::character varying,
postcall_ivr_type integer,
CONSTRAINT ce_postcall_ivr_pkey PRIMARY KEY (id)
);

GRANT ALL ON TABLE public.ce_postcall_ivr TO interact;
GRANT SELECT ON TABLE public.ce_postcall_ivr TO looker;

CREATE INDEX ce_postcall_ivr_type_idx
ON public.ce_postcall_ivr
USING btree
(postcall_ivr_type);

CREATE OR REPLACE RULE get_pkey_on_insert_ce_postcall_ivr AS ON INSERT TO ce_postcall_ivr DO SELECT currval('ce_postcall_ivr_id_seq'::text::regclass) AS id;

CREATE TABLE public.ce_postcall_ivr_type(
id SERIAL NOT NULL,
ivr_type integer,
comment character varying(255) DEFAULT NULL::character varying,
CONSTRAINT ce_postcall_ivr_type_pkey PRIMARY KEY (id)
);

GRANT ALL ON TABLE public.ce_postcall_ivr_type TO interact;
GRANT SELECT ON TABLE public.ce_postcall_ivr_type TO looker;

CREATE INDEX ce_postcall_ivr_type_ivr_type_idx
ON public.ce_postcall_ivr_type
USING btree
(ivr_type);

CREATE OR REPLACE RULE get_pkey_on_insert_ce_postcall_ivr_type AS ON INSERT TO ce_postcall_ivr_type DO SELECT currval('ce_postcall_ivr_type_id_seq'::text::regclass) AS id;

CREATE TABLE public.ce_randomhelper(
npa character varying(3),
nxx character varying(3),
state character varying(2),
country character varying(2)
);

GRANT ALL ON TABLE public.ce_randomhelper TO interact;
GRANT SELECT ON TABLE public.ce_randomhelper TO looker;

CREATE TABLE public.ce_schedule_options (
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
CONSTRAINT ce_schedule_options_pkey PRIMARY KEY (id),
CONSTRAINT ce_hunt_type_id_fkey FOREIGN KEY (ce_hunt_type_id)
REFERENCES public.ce_hunt_types (id) MATCH SIMPLE
ON UPDATE CASCADE ON DELETE CASCADE
);

GRANT ALL ON TABLE public.ce_schedule_options TO interact;
GRANT SELECT ON TABLE public.ce_schedule_options TO looker;

CREATE TABLE public.ce_schedule_routes(
id SERIAL NOT NULL,
timezone integer,
timezone_name character varying(20) DEFAULT NULL::character varying,
CONSTRAINT ce_schedule_routes_pkey PRIMARY KEY (id)
);

GRANT ALL ON TABLE public.ce_schedule_routes TO interact;
GRANT SELECT ON TABLE public.ce_schedule_routes TO looker;

CREATE INDEX ce_schedule_routes_timezone_idx
ON public.ce_schedule_routes
USING btree
(timezone);

CREATE OR REPLACE RULE get_pkey_on_insert_ce_schedule_routes AS ON INSERT TO ce_schedule_routes DO SELECT currval('ce_schedule_routes_id_seq'::text::regclass) AS id;

CREATE TABLE public.ce_sp_fieldmap (
id SERIAL NOT NULL,
session_data_name character varying(255) DEFAULT NULL::character varying,
callflow_field character varying(1024) DEFAULT NULL::character varying,
enabled smallint DEFAULT 1,
sp_section character varying(50),
listorder smallint,
CONSTRAINT ce_sp_fieldmap_pkey PRIMARY KEY (id)
);

GRANT ALL ON TABLE public.ce_sp_fieldmap TO interact;
GRANT SELECT ON TABLE public.ce_sp_fieldmap TO looker;

CREATE INDEX ce_sp_fieldmap_callflow_field_idx
ON public.ce_sp_fieldmap
USING btree
(callflow_field COLLATE pg_catalog."default");

CREATE INDEX ce_sp_fieldmap_enabled_idx
ON public.ce_sp_fieldmap
USING btree
(enabled);

CREATE INDEX ce_sp_fieldmap_listorder_idx
ON public.ce_sp_fieldmap
USING btree
(listorder);

CREATE INDEX ce_sp_fieldmap_session_data_name_idx
ON public.ce_sp_fieldmap
USING btree
(session_data_name COLLATE pg_catalog."default");

CREATE INDEX ce_sp_fieldmap_sp_section_idx
ON public.ce_sp_fieldmap
USING btree
(sp_section COLLATE pg_catalog."default");

CREATE OR REPLACE RULE get_pkey_on_insert_ce_sp_fieldmap AS ON INSERT TO ce_sp_fieldmap DO SELECT currval('ce_sp_fieldmap_id_seq'::text::regclass) AS id;

CREATE TABLE public.ce_voicemail_msgs(
created_epoch integer,
read_epoch integer,
username character varying(255) DEFAULT NULL::character varying,
domain character varying(255) DEFAULT NULL::character varying,
uuid character varying(255) DEFAULT NULL::character varying,
cid_name character varying(255) DEFAULT NULL::character varying,
cid_number character varying(255) DEFAULT NULL::character varying,
in_folder character varying(255) DEFAULT NULL::character varying,
file_path character varying(255) DEFAULT NULL::character varying,
message_len integer,
flags character varying(255) DEFAULT NULL::character varying,
read_flags character varying(255) DEFAULT NULL::character varying,
forwarded_by character varying(255) DEFAULT NULL::character varying
);

GRANT ALL ON TABLE public.ce_voicemail_msgs TO interact;
GRANT SELECT ON TABLE public.ce_voicemail_msgs TO looker;

CREATE INDEX ce_voicemail_msgs_username_did_idx
ON public.ce_voicemail_msgs
USING btree
(username COLLATE pg_catalog."default");

CREATE INDEX ce_voicemail_msgs_uuid_idx
ON public.ce_voicemail_msgs
USING btree
(uuid COLLATE pg_catalog."default");

CREATE TABLE public.ce_voicemail_prefs (
username character varying(255) DEFAULT NULL::character varying,
domain character varying(255) DEFAULT NULL::character varying,
name_path character varying(255) DEFAULT NULL::character varying,
greeting_path character varying(255) DEFAULT NULL::character varying,
password character varying(255) DEFAULT NULL::character varying
);

GRANT ALL ON TABLE public.ce_voicemail_prefs TO interact;
GRANT SELECT ON TABLE public.ce_voicemail_prefs TO looker;

CREATE INDEX ce_voicemail_prefs_password_idx
ON public.ce_voicemail_prefs
USING btree
(password COLLATE pg_catalog."default");

CREATE INDEX ce_voicemail_prefs_username_did_idx
ON public.ce_voicemail_prefs
USING btree
(username COLLATE pg_catalog."default");

ALTER TABLE public.ce_schedule_options ADD CONSTRAINT schedule_route_id_fkey FOREIGN KEY (schedule_route_id) REFERENCES public.ce_schedule_routes (id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE public.ce_schedule_options DROP CONSTRAINT ce_hunt_type_id_fkey;

ALTER TABLE ce_percentage_route_options DROP CONSTRAINT ce_hunt_type_id_fkey;

INSERT INTO ce_geo_lookup (npa,nxx,zip,state,city,rc,latitude,longitude) (
SELECT npa,nxx,substring(zipcode,1,5),state,city,rc,
CAST(latitude AS DOUBLE PRECISION),
CAST(longitude AS DOUBLE PRECISION)
FROM npanxx_city
);

CREATE OR REPLACE RULE get_pkey_on_insert AS
ON INSERT TO phone_pool DO  SELECT currval('phone_pool_pool_id_seq'::text::regclass) AS pool_id;