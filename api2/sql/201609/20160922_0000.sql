ALTER TABLE public.log_schedule ALTER COLUMN log_date TYPE timestamp(3) with time zone;

ALTER TABLE webhook ADD COLUMN pre_call BOOLEAN NOT NULL DEFAULT false;
