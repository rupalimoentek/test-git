CREATE SEQUENCE public.ct_dni_logs_dni_log_id_seq
INCREMENT 1
MINVALUE 1000
MAXVALUE 9223372036854775807
START 1000
CACHE 1;

CREATE SEQUENCE public.dni_phone_numbers_dni_phone_numbers_id_seq
INCREMENT 1
MINVALUE 1000
MAXVALUE 9223372036854775807
START 1000
CACHE 1;

CREATE SEQUENCE public.dni_call_details_dni_call_detail_id
INCREMENT 1
MINVALUE 1000
MAXVALUE 9223372036854775807
START 1000
CACHE 1;

CREATE TABLE public.ct_dni_logs
(
id integer NOT NULL DEFAULT nextval('ct_dni_logs_dni_log_id_seq'::regclass),
dni_log_id text NOT NULL,
browser text DEFAULT NULL ,
created_at timestamp(0) with time zone DEFAULT NULL::timestamp with time zone,
custom_params json,
destination_url text DEFAULT NULL ,
dni_vid text DEFAULT NULL ,
first_page text DEFAULT NULL ,
ga_cid text DEFAULT NULL ,
ip_host text DEFAULT NULL ,
last_page text DEFAULT NULL ,
log_date text DEFAULT NULL ,
master_node_id integer,
organizational_unit_id integer,
referring text DEFAULT NULL ,
referring_type text DEFAULT NULL ,
referring_url text DEFAULT NULL ,
search_words text DEFAULT NULL ,
session_id text DEFAULT NULL ,
updated_at text DEFAULT NULL ,
ip text DEFAULT NULL ,
country_code text DEFAULT NULL ,
country_name text DEFAULT NULL ,
region_code text DEFAULT NULL ,
region_name text DEFAULT NULL ,
city text DEFAULT NULL ,
zipcode text DEFAULT NULL ,
latitude text DEFAULT NULL ,
longitude text DEFAULT NULL ,
metro_code text DEFAULT NULL ,
area_code text DEFAULT NULL ,
ref_param json,
utm_campaign text DEFAULT NULL ,
utm_source text DEFAULT NULL ,
utm_medium text DEFAULT NULL ,
gclid text DEFAULT NULL ,
gclsrc text DEFAULT NULL ,
CONSTRAINT ct_dni_logs_pkey PRIMARY KEY (dni_log_id)
)

CREATE TABLE public.dni_phone_numbers
(
id integer NOT NULL DEFAULT nextval('dni_phone_numbers_dni_phone_numbers_id_seq'::regclass),
dni_log_id text DEFAULT NULL ,
dni_id text DEFAULT NULL ,
phone_number text DEFAULT NULL ,
element text DEFAULT NULL ,
phone_number_id text DEFAULT NULL ,
pool_id text DEFAULT NULL ,
number_last_used text DEFAULT NULL ,
provisioned_route_id text DEFAULT NULL ,
CONSTRAINT dni_phone_numbers_id_fkey FOREIGN KEY (dni_log_id)
REFERENCES public.ct_dni_logs (dni_log_id) MATCH SIMPLE
ON UPDATE CASCADE ON DELETE CASCADE
)

CREATE TABLE public.dni_call_details
(
id integer NOT NULL DEFAULT nextval('dni_call_details_dni_call_detail_id'::regclass),
mongo_id text DEFAULT NULL ,
phone_number text DEFAULT NULL ,
call_id text DEFAULT NULL ,
source text DEFAULT NULL ,
repeat_call text DEFAULT NULL ,
CONSTRAINT dni_call_details_mongo_id_fkey FOREIGN KEY (mongo_id)
REFERENCES public.ct_dni_logs (mongo_id) MATCH SIMPLE
ON UPDATE CASCADE ON DELETE CASCADE
)