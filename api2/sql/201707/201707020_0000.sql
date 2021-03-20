CREATE TABLE public.call_action_log
(
  call_id integer NOT NULL,
  action_id integer NOT NULL,
  action_trigger boolean NOT NULL DEFAULT false, 
CONSTRAINT call_call_id_fkey FOREIGN KEY (call_id)
      REFERENCES public.call (call_id)
      ON UPDATE CASCADE ON DELETE CASCADE,
CONSTRAINT action_action_id_fkey FOREIGN KEY (action_id)
      REFERENCES public.call_action (action_id)
      ON UPDATE CASCADE ON DELETE CASCADE
 );