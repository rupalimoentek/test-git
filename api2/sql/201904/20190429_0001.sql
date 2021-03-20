
UPDATE email_master SET dynamic_field='{first_name,last_name,rule_str,call_started,campaign_name,source,route_name,tracking,ring_to,recording_url,disposition,duration,call_value,caller_street,caller_city,caller_state,caller_zip,caller_first_name,caller_last_name, ad_source, duration}',
    field_display='{"First Name","Last Name","Call Action Rule","Call Start Timestamp","Campaign Name","Caller ID","Route Name","Tracking Number","Destination Number","Recording URL",Disposition,Duration,"Call Value","Caller Street Address","Caller City","Caller State","Caller Zip","Caller First Name","Caller Last Name", "Ad Source", "duration"}'
WHERE master_id=4;


