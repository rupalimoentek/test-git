ALTER TABLE org_unit ADD COLUMN protect_caller_id boolean NOT NULL DEFAULT false

CREATE TABLE public.org_data_append_setting
(
  org_unit_id integer NOT NULL,
  is_caller_name boolean NOT NULL DEFAULT false,
  is_company_name boolean NOT NULL DEFAULT false,
  is_address boolean NOT NULL DEFAULT false,
  is_city boolean NOT NULL DEFAULT false,
  is_zip boolean NOT NULL DEFAULT false,
  is_state boolean NOT NULL DEFAULT false,
  is_line_type boolean NOT NULL DEFAULT false,
  CONSTRAINT org_data_append_pkey PRIMARY KEY (org_unit_id),
  CONSTRAINT org_data_append_org_unit_id_fkey FOREIGN KEY (org_unit_id)
      REFERENCES public.org_unit (org_unit_id) MATCH SIMPLE
      ON UPDATE CASCADE ON DELETE CASCADE
)
