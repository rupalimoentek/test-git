CREATE TABLE public.subscription_types (
subscription_type_id SERIAL NOT NULL,
subscription_type_name VARCHAR(10),
created_by INTEGER NOT NULL,
created_on timestamp(0) with time zone NOT NULL DEFAULT now(),
updated_by INTEGER NOT NULL,
updated_on timestamp(0) with time zone NOT NULL DEFAULT now(),
CONSTRAINT subscription_types_pkey PRIMARY KEY (subscription_type_id)
);

SELECT * from subscription

INSERT INTO subscription_types (subscription_type_name, created_by, created_on, updated_by, updated_on) VALUES('CFA', 1, NOW(), 1, NOW());
INSERT INTO subscription_types (subscription_type_name, created_by, created_on, updated_by, updated_on) VALUES ('CQM', 1, NOW(), 1, NOW());

ALTER TABLE public.subscription ADD COLUMN subscription_type_id integer;

SELECT * from public.subscription_types

ALTER TABLE public.subscription
ADD CONSTRAINT subscription_type_id_fkey FOREIGN KEY (subscription_type_id)
REFERENCES public.subscription_types (subscription_type_id) MATCH SIMPLE;

SELECT * from subscription LIMIT 1

CREATE TABLE public.component_types (
component_type_id SERIAL NOT NULL,
component_type_name VARCHAR(20),
created_by INTEGER NOT NULL,
created_on timestamp(0) with time zone NOT NULL DEFAULT now(),
updated_by INTEGER NOT NULL,
updated_on timestamp(0) with time zone NOT NULL DEFAULT now(),
CONSTRAINT component_types_pkey PRIMARY KEY (component_type_id)
);
INSERT INTO component_types (component_type_name, created_by, created_on, updated_by, updated_on) VALUES('api', 1, NOW(), 1, NOW());
INSERT INTO component_types (component_type_name, created_by, created_on, updated_by, updated_on) VALUES('analytics', 1, NOW(), 1, NOW());
INSERT INTO component_types (component_type_name, created_by, created_on, updated_by, updated_on) VALUES('api_analytics', 1, NOW(), 1, NOW());
INSERT INTO component_types (component_type_name, created_by, created_on, updated_by, updated_on) VALUES ('calls', 1, NOW(), 1, NOW());
INSERT INTO component_types (component_type_name, created_by, created_on, updated_by, updated_on) VALUES('minutes', 1, NOW(), 1, NOW()); 
INSERT INTO component_types (component_type_name, created_by, created_on, updated_by, updated_on) VALUES ('users', 1, NOW(), 1, NOW());
INSERT INTO component_types (component_type_name, created_by, created_on, updated_by, updated_on) VALUES ('number', 1, NOW(), 1, NOW());


SELECT * from component_types
ALTER TABLE public.component ADD COLUMN component_type_id integer;
ALTER TABLE public.component
ADD CONSTRAINT component_type_id_fkey FOREIGN KEY (component_type_id)
REFERENCES public.component_types (component_type_id) MATCH SIMPLE;

Create sequence usages_logs_usages_log_id_seq
CREATE TABLE public.usages_logs(
usages_log_id integer NOT NULL DEFAULT nextval('usages_logs_usages_log_id_seq'::regclass),
org_unit_id integer,
account_code character varying(20),
billing_code character varying(20),
usage_data json,
created_by integer NOT NULL,
created_on timestamp(0) with time zone NOT NULL DEFAULT now(),
updated_by integer NOT NULL,
updated_on timestamp(0) with time zone NOT NULL DEFAULT now(),
CONSTRAINT usages_log_pkey PRIMARY KEY (usages_log_id),
CONSTRAINT org_unit_id_fkey FOREIGN KEY (org_unit_id)
REFERENCES public.org_unit (org_unit_id) MATCH SIMPLE
ON UPDATE NO ACTION ON DELETE NO ACTION
);

UPDATE subscription SET subscription_type_id = 2 WHERE subscription_id IN (29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49); 

SELECT sc.* from component c
JOIN subscription_component sc ON (sc.component_id = c.component_id) 
JOIN subscription s ON (s.subscription_id = sc.subscription_id)
where s.subscription_type_id = 2

UPDATE subscription SET subscription_name = replace(subscription_name, 'Cqm', '') WHERE subscription_name ILIKE '%Cqm%';

UPDATE subscription_component SET component_ext_id = NULL WHERE subscription_id IN ( SELECT s.subscription_id FROM
subscription s WHERE s.subscription_type_id = 2) AND component_ext_id = 'null';

SELECT * FROM
 subscription s WHERE s.subscription_type_id = 2


UPDATE component SET component_type_id = 7 where component_id = 212;
 UPDATE component SET component_type_id = 7 where component_id = 134;
 UPDATE component SET component_type_id = 6 where component_id = 149;
 UPDATE component SET component_type_id = 5 where component_id = 174;
 UPDATE component SET component_type_id = 6 where component_id = 137;
 UPDATE component SET component_type_id = 7 where component_id = 212;
 UPDATE component SET component_type_id = 5 where component_id = 174;
 UPDATE component SET component_type_id = 7 where component_id = 135;
 UPDATE component SET component_type_id = 7 where component_id = 212;
 UPDATE component SET component_type_id = 6 where component_id = 142;
 UPDATE component SET component_type_id = 2 where component_id = 204;
 UPDATE component SET component_type_id = 5 where component_id = 174;
 UPDATE component SET component_type_id = 6 where component_id = 152;
 UPDATE component SET component_type_id = 7 where component_id = 134;
 UPDATE component SET component_type_id = 5 where component_id = 174;
 UPDATE component SET component_type_id = 7 where component_id = 212;
 UPDATE component SET component_type_id = 2 where component_id = 204;
 UPDATE component SET component_type_id = 6 where component_id = 154;
 UPDATE component SET component_type_id = 7 where component_id = 212;
 UPDATE component SET component_type_id = 4 where component_id = 146;
 UPDATE component SET component_type_id = 5 where component_id = 174;
 UPDATE component SET component_type_id = 5 where component_id = 138;
 UPDATE component SET component_type_id = 4 where component_id = 146;
 UPDATE component SET component_type_id = 7 where component_id = 212;
 UPDATE component SET component_type_id = 5 where component_id = 138;
 UPDATE component SET component_type_id = 7 where component_id = 212;
 UPDATE component SET component_type_id = 5 where component_id = 138;
 UPDATE component SET component_type_id = 7 where component_id = 212;
 UPDATE component SET component_type_id = 5 where component_id = 174;
 UPDATE component SET component_type_id = 6 where component_id = 143;
 UPDATE component SET component_type_id = 7 where component_id = 135;
 UPDATE component SET component_type_id = 7 where component_id = 212;
 UPDATE component SET component_type_id = 4 where component_id = 146;
 UPDATE component SET component_type_id = 5 where component_id = 174;
 UPDATE component SET component_type_id = 6 where component_id = 159;
 UPDATE component SET component_type_id = 7 where component_id = 161;
 UPDATE component SET component_type_id = 4 where component_id = 146;
 UPDATE component SET component_type_id = 7 where component_id = 212;
 UPDATE component SET component_type_id = 7 where component_id = 212;
 UPDATE component SET component_type_id = 7 where component_id = 162;
 UPDATE component SET component_type_id = 5 where component_id = 213;
 UPDATE component SET component_type_id = 3 where component_id = 209;
 UPDATE component SET component_type_id = 6 where component_id = 164;
 UPDATE component SET component_type_id = 7 where component_id = 208;
 UPDATE component SET component_type_id = 3 where component_id = 209;
 UPDATE component SET component_type_id = 7 where component_id = 212;
 UPDATE component SET component_type_id = 4 where component_id = 146;
 UPDATE component SET component_type_id = 5 where component_id = 213;
 UPDATE component SET component_type_id = 6 where component_id = 175;
 UPDATE component SET component_type_id = 5 where component_id = 174;
 UPDATE component SET component_type_id = 6 where component_id = 175;
 UPDATE component SET component_type_id = 7 where component_id = 135;
 UPDATE component SET component_type_id = 7 where component_id = 212;
 UPDATE component SET component_type_id = 4 where component_id = 146;
 UPDATE component SET component_type_id = 5 where component_id = 168;
 UPDATE component SET component_type_id = 5 where component_id = 140;
 UPDATE component SET component_type_id = 1 where component_id = 205;
 UPDATE component SET component_type_id = 7 where component_id = 139;
 UPDATE component SET component_type_id = 7 where component_id = 212;
 UPDATE component SET component_type_id = 5 where component_id = 213;
 UPDATE component SET component_type_id = 7 where component_id = 212;
 UPDATE component SET component_type_id = 7 where component_id = 208;
 UPDATE component SET component_type_id = 6 where component_id = 175;
 UPDATE component SET component_type_id = 1 where component_id = 205;
 UPDATE component SET component_type_id = 3 where component_id = 209;
 UPDATE component SET component_type_id = 5 where component_id = 144;
 UPDATE component SET component_type_id = 7 where component_id = 212;
 UPDATE component SET component_type_id = 7 where component_id = 139;
 UPDATE component SET component_type_id = 6 where component_id = 145;
 UPDATE component SET component_type_id = 5 where component_id = 174;
 UPDATE component SET component_type_id = 7 where component_id = 135;
 UPDATE component SET component_type_id = 6 where component_id = 142;
 UPDATE component SET component_type_id = 7 where component_id = 135;
 UPDATE component SET component_type_id = 6 where component_id = 143;
 UPDATE component SET component_type_id = 1 where component_id = 205;
 UPDATE component SET component_type_id = 5 where component_id = 174;
 UPDATE component SET component_type_id = 7 where component_id = 212;
 UPDATE component SET component_type_id = 1 where component_id = 205;
 UPDATE component SET component_type_id = 3 where component_id = 209;
 UPDATE component SET component_type_id = 5 where component_id = 213;
 UPDATE component SET component_type_id = 7 where component_id = 212;
 UPDATE component SET component_type_id = 7 where component_id = 208;
 UPDATE component SET component_type_id = 6 where component_id = 175;
 UPDATE component SET component_type_id = 6 where component_id = 175;
 UPDATE component SET component_type_id = 1 where component_id = 205;
 UPDATE component SET component_type_id = 5 where component_id = 174;
 UPDATE component SET component_type_id = 7 where component_id = 212;
 UPDATE component SET component_type_id = 7 where component_id = 135;
 UPDATE component SET component_type_id = 6 where component_id = 137;
 UPDATE component SET component_type_id = 7 where component_id = 212;
 UPDATE component SET component_type_id = 5 where component_id = 174;
 UPDATE component SET component_type_id = 2 where component_id = 204;

