CREATE TABLE public.default_custom_source_value
(
custom_source_id serial PRIMARY KEY,
custom_source_type_id integer NOT NULL,
org_unit_id integer NOT NULL,
custom_source_value character varying(100) NOT NULL,
  CONSTRAINT default_custom_source_value_org_unit_id_fkey FOREIGN KEY (org_unit_id)
      REFERENCES public.org_unit (org_unit_id) MATCH SIMPLE,
   CONSTRAINT default_custom_source_value_custom_source_type_id_fkey FOREIGN KEY (custom_source_type_id)
      REFERENCES public.default_custom_source(custom_source_type_id) MATCH SIMPLE
      ON UPDATE CASCADE ON DELETE CASCADE
 )

ALTER TABLE default_custom_source 
 ADD COLUMN custom_source_type_id serial PRIMARY KEY
