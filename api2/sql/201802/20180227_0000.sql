## For Postgres production pg-la-internal.convirza.com

## Create sequence for report id handling
CREATE SEQUENCE public.report_report_id_seq
INCREMENT 1
MINVALUE 1000
MAXVALUE 9999
START 1111
CACHE 1;

### Create table reports for handling looker reports in PostgreSQL.

CREATE TABLE public.reports
(
report_id integer NOT NULL DEFAULT nextval('report_report_id_seq'::regclass),
report_name text,
report_description text,
looker_id integer NOT NULL,
is_default boolean NOT NULL DEFAULT false,
is_deleted boolean NOT NULL DEFAULT false,
report_ous integer[],
ca_looker_id integer,
is_admin_only boolean NOT NULL DEFAULT false,
CONSTRAINT reports_pkey PRIMARY KEY (report_id)
);

## Create table user_permissions for handling user permission in postgres

CREATE TABLE public.user_permissions
(
ct_user_id integer NOT NULL,
groups_list integer[],
reports_list integer[],
score_call boolean NOT NULL DEFAULT false,
access_audio boolean NOT NULL DEFAULT false,
CONSTRAINT user_permission_ct_user_id_fkey FOREIGN KEY (ct_user_id)
REFERENCES public.ct_user (ct_user_id) MATCH SIMPLE
ON UPDATE CASCADE ON DELETE CASCADE,
CONSTRAINT user_permissions_ct_user_id_key UNIQUE (ct_user_id)
);

### Create a view for user logs report in looker

CREATE OR REPLACE VIEW public.ct_logs AS
SELECT 'log_billing'::text AS log_name,
log_billing.org_unit_id,
log_billing.ct_user_id,
log_billing.log_date,
log_billing.log_data,
NULL::integer AS action_id
FROM log_billing
UNION ALL
SELECT 'log_campaign'::text AS log_name,
log_campaign.org_unit_id,
log_campaign.ct_user_id,
log_campaign.log_date,
log_campaign.log_data,
log_campaign.campaign_id AS action_id
FROM log_campaign
UNION ALL
SELECT 'log_call_action'::text AS log_name,
log_call_action.org_unit_id,
log_call_action.ct_user_id,
log_call_action.log_date,
log_call_action.log_data,
log_call_action.action_id
FROM log_call_action
UNION ALL
SELECT 'log_call_flow'::text AS log_name,
log_call_flow.org_unit_id,
log_call_flow.ct_user_id,
log_call_flow.log_date,
log_call_flow.log_data,
log_call_flow.call_flow_id AS action_id
FROM log_call_flow
UNION ALL
SELECT 'log_integration'::text AS log_name,
log_integration.org_unit_id,
log_integration.ct_user_id,
log_integration.log_date,
log_integration.log_data,
NULL::integer AS action_id
FROM log_integration
UNION ALL
SELECT 'log_ivr'::text AS log_name,
log_ivr.org_unit_id,
log_ivr.ct_user_id,
log_ivr.log_date,
log_ivr.log_data,
NULL::integer AS action_id
FROM log_ivr
UNION ALL
SELECT 'log_tag'::text AS log_name,
log_tag.org_unit_id,
log_tag.ct_user_id,
log_tag.log_date,
log_tag.log_data,
log_tag.tag_id AS action_id
FROM log_tag
UNION ALL
SELECT 'log_user'::text AS log_name,
log_user.org_unit_id,
log_user.ct_user_id,
log_user.log_date,
log_user.log_data,
NULL::integer AS action_id
FROM log_user
UNION ALL
SELECT 'log_webhook'::text AS log_name,
log_webhook.org_unit_id,
log_webhook.ct_user_id,
log_webhook.log_date,
log_webhook.log_data,
log_webhook.webhook_id AS action_id
FROM log_webhook
UNION ALL
SELECT 'log_distribution_list'::text AS log_name,
log_distribution_list.org_unit_id,
log_distribution_list.ct_user_id,
log_distribution_list.log_date,
log_distribution_list.log_data,
log_distribution_list.distribution_list_id AS action_id
FROM log_distribution_list
UNION ALL
SELECT 'log_schedule'::text AS log_name,
log_schedule.org_unit_id,
log_schedule.ct_user_id,
log_schedule.log_date,
log_schedule.log_data,
log_schedule.schedule_id AS action_id
FROM log_schedule;

### Create a view for Webhook logs report in looker
CREATE OR REPLACE VIEW public.v_webhook_logs AS
SELECT row_number() OVER (ORDER BY wb.log_date) AS id,
wb.webhook_id,
wb.webhook_name,
wb.target_url,
wb.org_unit_id,
wb.log_date,
wb.type,
wb.sent_status
FROM ( SELECT w.webhook_name,
w.target_url,
w.org_unit_id,
pw.webhook_id,
pw.log_date,
'Pre Call Webhook'::text AS type,
true AS sent_status
FROM log_pre_webhook pw
JOIN webhook w ON w.webhook_id = pw.webhook_id
UNION
SELECT w.webhook_name,
w.target_url,
w.org_unit_id,
((ca.action_data -> 'action'::text) ->> 'action_target'::text)::integer AS webhook_id,
ca.action_triggered AS log_date,
'Post Call Webhook'::text AS type,
ca.action_trigger AS sent_status
FROM call_action_log ca
JOIN webhook w ON (((ca.action_data -> 'action'::text) ->> 'action_target'::text)::integer) = w.webhook_id
WHERE ((ca.action_data -> 'action'::text) ->> 'action'::text) = 'webhook'::text) wb;

### Create table npanxx_city_small for caller activity report.
CREATE TABLE npanxx_city_small AS SELECT zipcode,npanxx,state,city,country FROM npanxx_city GROUP BY zipcode,npanxx,state,city,country;
CREATE INDEX npanxx_idx ON npanxx_city_small (npanxx);

### Grant Access to dni realated tables and newly created views to looker user
GRANT ALL ON table public.ct_dni_logs to looker;
GRANT ALL ON table public.dni_phone_numbers to looker;
GRANT ALL ON table public.ct_logs to looker;
GRANT ALL ON table public.v_webhook_logs to looker;
GRANT ALL ON table public.npanxx_city_small to looker;
GRANT ALL ON table public.user_permissions to looker;

## For mysql production
### to allows looker user access to the FDW:

### MySQL @ mysql01.ec2.logmycalls.com
### Create a looker user if not present on db server first then run following queries

GRANT USAGE ON *.* TO 'looker'@'%' IDENTIFIED BY 'yJspWRZSpxoX6';
GRANT SELECT ON `newcallengine_prod`.`geo_options` TO 'looker'@'%';
GRANT SELECT ON `newcallengine_prod`.`blacklist` TO 'looker'@'%';
GRANT SELECT ON `newcallengine_prod`.`geo_claimed_zip` TO 'looker'@'%';
GRANT SELECT ON `newcallengine_prod`.`ivr_routes2` TO 'looker'@'%';
GRANT SELECT ON `newcallengine_prod`.`schedule_options` TO 'looker'@'%';
GRANT SELECT ON `newcallengine_prod`.`geo_routes` TO 'looker'@'%';
GRANT SELECT ON `newcallengine_prod`.`call_flows` TO 'looker'@'%';
GRANT SELECT ON `newcallengine_prod`.`ivr_routes` TO 'looker'@'%';
GRANT SELECT ON `newcallengine_prod`.`percentage_route` TO 'looker'@'%';
GRANT SELECT ON `newcallengine_prod`.`ivr_options2` TO 'looker'@'%';
GRANT SELECT ON `newcallengine_prod`.`ivr_options` TO 'looker'@'%';
GRANT SELECT ON `newcallengine_prod`.`schedule_routes` TO 'looker'@'%';
GRANT SELECT ON `newcallengine_prod`.`percentage_route_options` TO 'looker'@'%';


### PG

CREATE USER MAPPING FOR looker SERVER mysql_ce OPTIONS (username 'looker', password 'yJspWRZSpxoX6');

## and a missing FLUSH PRIVILEGES; on the mysql



