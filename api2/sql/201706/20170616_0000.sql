ALTER TABLE provisioned_route ADD COLUMN webhook_id INT DEFAULT NULL
REFERENCES webhook (webhook_id) ON DELETE CASCADE ON UPDATE CASCADE;

# create table log_pre_webhook
CREATE TABLE public.log_pre_webhook
(
  log_webhook_id bigint NOT NULL DEFAULT nextval('log_webhook_log_webhook_id_seq'::regclass),
  webhook_id integer,
  log_date timestamp(3) with time zone NOT NULL DEFAULT now(),
  log_data json NOT NULL,
  CONSTRAINT log_pre_webhook_pkey PRIMARY KEY (log_webhook_id),
  CONSTRAINT log_webhook_webhook_id_fkey FOREIGN KEY (webhook_id)
      REFERENCES public.webhook (webhook_id) MATCH SIMPLE
      ON UPDATE CASCADE ON DELETE CASCADE
);