ALTER TABLE public.call_action_log
ADD COLUMN action_data json NOT NULL,
ADD COLUMN action_triggered timestamp without time zone NOT NULL DEFAULT now();
