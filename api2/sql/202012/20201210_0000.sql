--Update dynamic feilds for email notifications
UPDATE email_master
SET dynamic_field = '{first_name,last_name,rule_str,call_started,campaign_name,source,route_name,tracking,ring_to,recording_url,disposition,duration,call_value,caller_street,caller_city,caller_state,caller_zip,caller_first_name,caller_last_name,key_presses}',
field_display = '{FirstName,LastName,CallActionRule,CallStartTimestamp,CampaignName,CallerID,RouteName,TrackingNumber,DestinationNumber,RecordingURL,Disposition,Duration,CallValue,CallerStreetAddress,CallerCity,CallerState,CallerZip,CallerFirstName,CallerLastName,KeyPresses}'
WHERE master_id = 4