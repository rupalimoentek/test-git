-- add Google Analytics link to dynamic fields
UPDATE email_master SET dynamic_field='{first_name,last_name,str,call_started,campaign_name,source,route_name,tracking,ring_to,url,ga_link}',
    field_display='{"First Name","Last Name","Call Action Rule","Call Start Timestamp","Campaign Name",Caller,"Route Name","Tracking Number","Destination Number","Recording URL","Google Analytics Link"}'
WHERE master_id=4;

CREATE RULE get_pkey_on_insert AS ON INSERT TO org_google_analytic DO SELECT currval('org_google_analytic_ga_id_seq'::text) AS ga_id;

ALTER TABLE org_google_analytic ADD COLUMN ga_active BOOLEAN NOT NULL DEFAULT false;
