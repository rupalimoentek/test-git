CREATE TABLE public.custom_source
(
  custom_source_id integer NOT NULL DEFAULT nextval('custom_source_custom_source_id_seq'::regclass),
  org_unit_id integer NOT NULL,
  custom_source_name character varying(100) NOT NULL,
  custom_source_created timestamp without time zone NOT NULL DEFAULT now(),
  custom_source_active boolean NOT NULL DEFAULT true,
  CONSTRAINT custom_source_pkey PRIMARY KEY (custom_source_id),
  CONSTRAINT custom_source_org_unit_id_fkey FOREIGN KEY (org_unit_id)
      REFERENCES public.org_unit (org_unit_id) MATCH SIMPLE
      ON UPDATE CASCADE ON DELETE CASCADE
)

CREATE TABLE public.callflow_custom_source
(
  provisioned_route_id integer NOT NULL,
  custom_source_id integer NOT NULL,
CONSTRAINT provisioned_route_provisioned_route_id_fkey FOREIGN KEY (provisioned_route_id)
      REFERENCES public.provisioned_route (provisioned_route_id)
      ON UPDATE CASCADE ON DELETE CASCADE,
CONSTRAINT custom_source_custom_source_id_fkey FOREIGN KEY (custom_source_id)
      REFERENCES public.custom_source (custom_source_id)
      ON UPDATE CASCADE ON DELETE CASCADE
 );
