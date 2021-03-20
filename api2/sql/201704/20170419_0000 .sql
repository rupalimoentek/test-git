CREATE TABLE public.call_custom_source
(
  call_id integer NOT NULL,
  custom_source_id integer NOT NULL,
CONSTRAINT call_call_id_fkey FOREIGN KEY (call_id)
      REFERENCES public.call (call_id)
      ON UPDATE CASCADE ON DELETE CASCADE,
CONSTRAINT custom_source_custom_source_id_fkey FOREIGN KEY (custom_source_id)
      REFERENCES public.custom_source (custom_source_id)
      ON UPDATE CASCADE ON DELETE CASCADE
 );
