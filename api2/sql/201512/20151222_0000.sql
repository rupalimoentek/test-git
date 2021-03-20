
-- update call_action e-mail template with newly added dynamic fields
UPDATE email_master SET dynamic_field='{first_name,last_name,rule_str,call_started,campaign_name,source,route_name,tracking,ring_to,recording_url,disposition,duration,call_value,
    caller_street,caller_city,caller_state,caller_zip,caller_first_name,caller_last_name}',
    field_display='{"First Name","Last Name","Call Action Rule","Call Start Timestamp","Campaign Name","Caller ID","Route Name","Tracking Number","Destination Number","Recording URL",
        Disposition,Duration,"Call Value","Caller Street Address","Caller City","Caller State","Caller Zip","Caller First Name","Caller Last Name"}'
WHERE master_id=4;

GRANT SELECT, UPDATE, DELETE, INSERT ON email_template TO interact;
GRANT SELECT, UPDATE ON email_template_email_id_seq TO interact;

GRANT SELECT, UPDATE, DELETE, INSERT ON org_google_analytic TO interact;
GRANT SELECT, UPDATE ON org_google_analytic_ga_id_seq TO interact;
