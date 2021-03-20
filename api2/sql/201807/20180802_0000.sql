CREATE SEQUENCE public.support_tickets_ticket_id_seq
INCREMENT 1
MINVALUE 1000
MAXVALUE 9223372036854775807
START 1000
CACHE 1;  

CREATE TABLE public.support_tickets
(
  ticket_id integer NOT NULL DEFAULT nextval('support_tickets_ticket_id_seq'::regclass),
  name character varying(50),
  email character varying(50),
  message text,
  account_id character varying(50),
  phone_number character varying(45)
)

CREATE OR REPLACE RULE get_pkey_on_insert AS
    ON INSERT TO support_tickets DO  SELECT currval('support_tickets_ticket_id_seq'::text::regclass) AS ticket_id;

