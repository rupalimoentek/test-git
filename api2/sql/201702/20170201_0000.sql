CREATE TYPE comptype AS ENUM ('number','minute');

ALTER TABLE org_component_count ADD COLUMN referral_count integer NOT NULL DEFAULT 0;

CREATE TABLE public.org_component
(
  org_unit_id integer NOT NULL,
  component_id integer NOT NULL,
  component_ext_id character varying(64),
  number_id integer,
  component_type comptype NOT NULL DEFAULT 'number'::comptype,
  CONSTRAINT component_component_id_fkey FOREIGN KEY (component_id)
      REFERENCES public.component (component_id)
      ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT org_unit_org_unit_id_fkey FOREIGN KEY (org_unit_id)
      REFERENCES public.org_unit (org_unit_id)
      ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT phone_number_number_id_fkey FOREIGN KEY (number_id)
      REFERENCES public.phone_number (number_id)
      ON UPDATE CASCADE ON DELETE CASCADE
);

