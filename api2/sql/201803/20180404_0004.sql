
-- Drop Existing dni_phone_numbers and ct_dni_logs tables.
DROP TABLE public.dni_phone_numbers;
DROP TABLE public.ct_dni_logs;

-- Create Tables for DNI LOGS
CREATE TABLE public.ct_dni_logs (
  ct_dni_log_id SERIAL NOT NULL,
  org_unit_id INTEGER, --master_node_id
  dni_log_id TEXT NOT NULL, 
  browser TEXT,
  custom_params JSON,
  destination_url TEXT,
  dni_vid TEXT,
  google_analytics_cid TEXT,
  ip_host TEXT,
  last_page TEXT,
  first_page TEXT,
  referring TEXT,
  referring_type TEXT,
  referring_url TEXT,
  search_words TEXT,
  session_id VARCHAR(25),
  created_by INTEGER NOT NULL,
  created_on timestamp(0) with time zone NOT NULL DEFAULT now(),
  updated_by INTEGER NOT NULL,
  updated_on timestamp(0) with time zone NOT NULL DEFAULT now(),
  CONSTRAINT ct_dni_logs_pkey PRIMARY KEY (ct_dni_log_id),
  CONSTRAINT org_unit_id_fkey FOREIGN KEY (org_unit_id) REFERENCES public.org_unit (org_unit_id) MATCH SIMPLE
);

CREATE TABLE public.area_details(
  area_detail_id SERIAL NOT NULL,
  city VARCHAR(20),
  region_code VARCHAR(20),
  region_name VARCHAR(20),
  ip_address VARCHAR(15),
  area_code VARCHAR(20),
  zipcode VARCHAR(10),
  longitude VARCHAR(20),
  latitude VARCHAR(20),
  metro_code VARCHAR(20),
  country_code VARCHAR(10),
  country_name VARCHAR(20),
  created_by INTEGER NOT NULL,
  created_on timestamp(0) with time zone NOT NULL DEFAULT now(),
  updated_by INTEGER NOT NULL,
  updated_on timestamp(0) with time zone NOT NULL DEFAULT now(),
  CONSTRAINT area_details_pkey PRIMARY KEY (area_detail_id)
);

CREATE TABLE public.ct_dni_log_location_details (
  ct_dni_log_location_detail_id SERIAL NOT NULL,
  ct_dni_log_id INTEGER NOT NULL,
  area_detail_id INTEGER NOT NULL,
  created_by INTEGER NOT NULL,
  created_on timestamp(0) with time zone NOT NULL DEFAULT now(),
  updated_by INTEGER NOT NULL,
  updated_on timestamp(0) with time zone NOT NULL DEFAULT now(),
  CONSTRAINT ct_dni_log_location_details_pkey PRIMARY KEY (ct_dni_log_location_detail_id),
  CONSTRAINT ct_dni_log_id_fkey FOREIGN KEY (ct_dni_log_id) REFERENCES public.ct_dni_logs (ct_dni_log_id) MATCH SIMPLE,
  CONSTRAINT area_detail_id_fkey FOREIGN KEY (area_detail_id) REFERENCES public.area_details (area_detail_id) MATCH SIMPLE
);

CREATE TABLE public.ct_dni_log_referring_parameters (
  ct_dni_log_referring_parameter_id SERIAL NOT NULL,
  ct_dni_log_id INTEGER NOT NULL,
  ref_param JSON,
  utm_campaign TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  gclid VARCHAR(50),
  gclsrc VARCHAR(50),
  utm_term VARCHAR(50),
  network VARCHAR(50),
  kw TEXT,
  mt TEXT,
  pos TEXT,
  ad TEXT,
  site TEXT,
  target TEXT,
  mobile TEXT,
  q TEXT,
  dclid VARCHAR(50),
  trkid VARCHAR(50),
  k_clickid VARCHAR(50),
  utm_content TEXT,
  created_by INTEGER NOT NULL,
  created_on timestamp(0) with time zone NOT NULL DEFAULT now(),
  updated_by INTEGER NOT NULL,
  updated_on timestamp(0) with time zone NOT NULL DEFAULT now(),
  CONSTRAINT ct_dni_log_referring_parameters_pkey PRIMARY KEY (ct_dni_log_referring_parameter_id),
  CONSTRAINT ct_dni_log_id_fkey FOREIGN KEY (ct_dni_log_id) REFERENCES public.ct_dni_logs (ct_dni_log_id) MATCH SIMPLE
);

CREATE TABLE public.dni_phone_numbers (
  dni_phone_number_id SERIAL NOT NULL,
  ct_dni_log_id INTEGER NOT NULL,
  phone_number_id BIGINT,
  provisioned_route_id INTEGER,
  phone_number BIGINT, 
  pool_id VARCHAR(10),
  element VARCHAR(50),  
  number_last_used timestamp(0) with time zone NOT NULL DEFAULT NULL,
  created_by INTEGER NOT NULL,
  created_on timestamp(0) with time zone NOT NULL DEFAULT now(),
  updated_by INTEGER NOT NULL,
  updated_on timestamp(0) with time zone NOT NULL DEFAULT now(),
  CONSTRAINT dni_phone_numbers_pkey PRIMARY KEY (dni_phone_number_id),
  CONSTRAINT ct_dni_log_id_fkey FOREIGN KEY (ct_dni_log_id) REFERENCES public.ct_dni_logs (ct_dni_log_id) MATCH SIMPLE,
  CONSTRAINT phone_number_id_fkey FOREIGN KEY (phone_number_id) REFERENCES public.phone_number (number_id) MATCH SIMPLE,
  CONSTRAINT provisioned_route_id_fkey FOREIGN KEY (provisioned_route_id) REFERENCES public.provisioned_route (provisioned_route_id) MATCH SIMPLE
);

CREATE TABLE public.dni_phone_details (
  dni_phone_detail_id SERIAL NOT NULL,
  dni_phone_number_id INTEGER NOT NULL,
  call_detail_id INTEGER NOT NULL,
  source VARCHAR(50),
  repeat_call BOOLEAN NOT NULL DEFAULT false,
  created_by INTEGER NOT NULL,
  created_on timestamp(0) with time zone NOT NULL DEFAULT now(),
  updated_by INTEGER NOT NULL,
  updated_on timestamp(0) with time zone NOT NULL DEFAULT now(),
  CONSTRAINT dni_phone_details_pkey PRIMARY KEY (dni_phone_detail_id),
  CONSTRAINT dni_phone_number_id_fkey FOREIGN KEY (dni_phone_number_id) REFERENCES public.dni_phone_numbers (dni_phone_number_id) MATCH SIMPLE,
  CONSTRAINT call_detail_id_fkey FOREIGN KEY (call_detail_id) REFERENCES public.call_detail (call_id) MATCH SIMPLE
);
