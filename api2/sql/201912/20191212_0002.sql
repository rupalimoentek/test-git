-- Insert Column Value in post_call_ivr_options

INSERT INTO post_call_ivr_options
(post_call_ivr_option_id,post_call_ivr_option_name,created_by,created_on,updated_by,updated_on) VALUES
(1,'Call Outcome (Conversion type)',1,current_timestamp,1,current_timestamp),
(2,'Agent ID',1,current_timestamp,1,current_timestamp),
(3,'Call Outcome and Agent ID',1,current_timestamp,1,current_timestamp);

--CT-32002

-- Add component for post call ivr
SELECT setval ('component_component_id_seq', (SELECT MAX(component_id)+1 FROM component));
INSERT INTO component(component_id, component_name, component_desc, component_active ) VALUES (929, 'Post Call IVR', 'This Component is created for Post Call IVR - Telephony Feature.', 't');

-- Add scope for post call ivr
INSERT INTO scope (scope_id, scope_code,scope_display,scope_desc) VALUES (39,'postcallivr', 'Post Call IVR', 'This scope is created for Post Call IVR - Telephony Feature.');

-- Give role access for post call ivr scope and component
INSERT INTO role_access (role_id, scope_id, component_id, permission) VALUES (1,39,929,7),(2,39,929,7),(3,39,929,4),(5,39,929,7),(6,39,929,7), (8,39,929,4),(4,39,929,7);



-- CT-25278
-- Add component for voicemail

INSERT INTO component(component_id, component_name, component_desc, component_active ) VALUES (928, 'Voicemail', 'This Component is created for Voicemail Telephony Feature.', 't');

-- Add scope for voicemail
INSERT INTO scope (scope_id, scope_code,scope_display,scope_desc) VALUES (40,'voicemail', 'Voicemail', 'This scope is created for Voicemail - Telephony Feature.');

-- Give role access for voicemail scope and component
INSERT INTO role_access (role_id, scope_id, component_id, permission) VALUES (1,40,928,7),(2,40,928,7),(3,40,928,4),(5,40,928,7),(6,40,928,7), (8,40,928,4),(4,40,928,7);



INSERT INTO phone_vendor(vendor_id, vendor_name,vendor_api) VALUES (10001, 'shoutpoint', 'https://api.shoutpoint.com/v1/');

INSERT INTO phone_vendor(vendor_id, vendor_name) VALUES (10002, 'SP SIP Trunck');

-- Add component for reserved numbers

INSERT INTO component(component_id, component_name, component_desc, component_active, component_type_id ) VALUES (930, 'Reserved Numbers', 'This Component is created for Reserved Numbers.', 't', 8);



-- Billing stories for Geo route and time of day
INSERT INTO component(component_id, component_name, component_desc, component_active ) VALUES (940, 'No Of Geo Route Ring-to', 'This Component is created for Billing Geo Route.', 't');
INSERT INTO component(component_id, component_name, component_desc, component_active ) VALUES (941, 'No Of Multi Level IVR Ring-to', 'This Component is created for Billing - multi level IVR.', 't');
INSERT INTO component(component_id, component_name, component_desc, component_active ) VALUES (942, 'No Of Geo Routes', 'This Component is created for Billing - No Of Geo Routes.', 't');
INSERT INTO component(component_id, component_name, component_desc, component_active ) VALUES (943, 'No Of Time Of Day Ring-to', 'This Component is created for Billing Time of Day.', 't');
INSERT INTO subscription_component(subscription_id, component_id) VALUES (1, 928);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (2, 928);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (3, 928);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (4, 928);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (5, 928);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (6, 928);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (7, 928);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (10, 928);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (9, 928);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (12, 928);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (14, 928);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (13, 928);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (15, 928);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (16, 928);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (17, 928);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (18, 928);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (19, 928);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (20, 928);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (21, 928);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (22, 928);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (23, 928);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (24, 928);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (25, 928);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (11, 928);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (28, 928);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (26, 928);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (29, 928);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (30, 928);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (31, 928);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (32, 928);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (33, 928);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (34, 928);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (35, 928);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (36, 928);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (37, 928);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (38, 928);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (39, 928);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (40, 928);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (41, 928);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (42, 928);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (43, 928);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (44, 928);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (45, 928);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (46, 928);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (47, 928);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (48, 928);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (49, 928);

INSERT INTO subscription_component(subscription_id, component_id) VALUES (27, 928);

INSERT INTO subscription_component(subscription_id, component_id) VALUES (1, 929);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (2, 929);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (3, 929);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (4, 929);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (5, 929);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (6, 929);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (7, 929);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (10, 929);

--Reviewed By Jitesh and Pravin

INSERT INTO subscription_component(subscription_id, component_id) VALUES (8, 929);

INSERT INTO subscription_component(subscription_id, component_id) VALUES (9, 929);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (12, 929);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (14, 929);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (13, 929);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (15, 929);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (16, 929);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (17, 929);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (18, 929);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (19, 929);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (20, 929);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (21, 929);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (22, 929);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (23, 929);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (24, 929);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (25, 929);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (11, 929);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (28, 929);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (26, 929);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (29, 929);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (30, 929);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (31, 929);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (32, 929);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (33, 929);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (34, 929);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (35, 929);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (36, 929);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (37, 929);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (38, 929);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (39, 929);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (40, 929);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (41, 929);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (42, 929);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (43, 929);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (44, 929);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (45, 929);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (46, 929);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (47, 929);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (48, 929);
INSERT INTO subscription_component(subscription_id, component_id) VALUES (49, 929);

INSERT INTO subscription_component(subscription_id, component_id) VALUES (27, 929);



--Updated LDM components for Minutes only

INSERT INTO component(component_id, component_name, component_desc, component_active, component_type_id ) VALUES (932, 'Alaska Long Distance Minutes', 'This Component is created for Alaska - long distance minutes.', 't', 5);

INSERT INTO component(component_id, component_name, component_desc, component_active, component_type_id ) VALUES (934, 'Puerto Long Distance Minutes', 'This Component is created for Puerto - long distance minutes.', 't', 5);

INSERT INTO component(component_id, component_name, component_desc, component_active, component_type_id ) VALUES (936, 'Hawaii Long Distance Minutes', 'This Component is created for Hawaii - long distance minutes.', 't', 5);

INSERT INTO component(component_id, component_name, component_desc, component_active, component_type_id ) VALUES (938, 'Canada Long Distance Minutes', 'This Component is created for Canada - long distance minutes.', 't', 5);



--Remove all the pre-listed NPAs from npa_blacklist table

DELETE FROM npa_blacklist;


INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (1, 932, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (2, 932, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (3, 932, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (4, 932, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (5, 932, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (6, 932, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (7, 932, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (8, 932, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (10, 932, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (12, 932, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (14, 932, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (13, 932, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (15, 932, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (16, 932, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (17, 932, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (18, 932, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (19, 932, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (20, 932, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (21, 932, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (22, 932, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (23, 932, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (24, 932, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (11, 932, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (27, 932, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (28, 932, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (26, 932, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (25, 932, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (51, 932, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (9, 932, 10000);


INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (1, 934, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (2, 934, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (3, 934, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (4, 934, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (5, 934, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (6, 934, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (7, 934, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (8, 934, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (10, 934, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (12, 934, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (14, 934, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (13, 934, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (15, 934, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (16, 934, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (17, 934, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (18, 934, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (19, 934, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (20, 934, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (21, 934, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (22, 934, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (23, 934, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (24, 934, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (11, 934, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (27, 934, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (28, 934, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (26, 934, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (25, 934, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (51, 934, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (9, 934, 10000);


INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (1, 936, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (2, 936, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (3, 936, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (4, 936, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (5, 936, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (6, 936, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (7, 936, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (8, 936, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (10, 936, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (12, 936, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (14, 936, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (13, 936, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (15, 936, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (16, 936, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (17, 936, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (18, 936, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (19, 936, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (20, 936, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (21, 936, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (22, 936, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (23, 936, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (24, 936, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (11, 936, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (27, 936, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (28, 936, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (26, 936, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (25, 936, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (51, 936, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (9, 936, 10000);


INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (1, 938, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (2, 938, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (3, 938, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (4, 938, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (5, 938, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (6, 938, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (7, 938, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (8, 938, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (10, 938, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (12, 938, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (14, 938, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (13, 938, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (15, 938, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (16, 938, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (17, 938, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (18, 938, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (19, 938, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (20, 938, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (21, 938, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (22, 938, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (23, 938, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (24, 938, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (11, 938, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (27, 938, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (28, 938, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (26, 938, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (25, 938, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (51, 938, 10000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (9, 938, 10000);



--Creating new Tiers for LDM components. (Please update usage_cast values as per production)
SELECT * from phone_tier
SELECT setval('phone_tier_tier_seq', (SELECT MAX(tier) FROM phone_tier));
INSERT INTO phone_tier(tier, tier_name,number_cost,usage_cost ) VALUES (100, 'LDM Alaska',1,0.15);
INSERT INTO phone_tier(tier, tier_name,number_cost,usage_cost ) VALUES (101, 'LDM Canada',2,0.09);
INSERT INTO phone_tier(tier, tier_name,number_cost,usage_cost ) VALUES (102, 'LDM Puerto Rico',2,0.25);
INSERT INTO phone_tier(tier, tier_name,number_cost,usage_cost ) VALUES (103, 'LDM Hawaii',1,0.06);
-- CT-31928
-- 1. Add missing fields in call_detail table
ALTER TABLE call_detail ADD COLUMN is_dni_call BOOLEAN DEFAULT false;
ALTER TABLE call_detail ADD COLUMN is_voicemail_checked BOOLEAN DEFAULT false;

-- 1. Add two fields in call table
ALTER TABLE call ADD COLUMN sp_call_id character varying(20);



--CT-31957

--1. Set sequence for pool_id

SELECT setval('phone_pool_pool_id_seq', 1);



--Adding Reserved Number component to all the subscription

INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (1, 930, 1000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (2, 930, 1000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (3, 930, 1000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (4, 930, 1000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (5, 930, 1000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (6, 930, 1000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (7, 930, 1000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (10, 930, 1000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (9, 930, 1000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (12, 930, 1000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (14, 930, 1000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (13, 930, 1000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (15, 930, 1000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (16, 930, 1000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (17, 930, 1000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (18, 930, 1000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (19, 930, 1000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (20, 930, 1000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (21, 930, 1000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (22, 930, 1000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (23, 930, 1000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (24, 930, 1000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (25, 930, 1000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (11, 930, 1000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (28, 930, 1000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (26, 930, 1000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (29, 930, 1000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (30, 930, 1000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (31, 930, 1000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (32, 930, 1000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (33, 930, 1000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (34, 930, 1000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (35, 930, 1000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (36, 930, 1000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (37, 930, 1000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (38, 930, 1000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (39, 930, 1000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (40, 930, 1000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (41, 930, 1000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (42, 930, 1000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (43, 930, 1000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (44, 930, 1000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (45, 930, 1000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (46, 930, 1000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (47, 930, 1000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (48, 930, 1000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (49, 930, 1000);
INSERT INTO subscription_component(subscription_id, component_id, component_threshold_max) VALUES (27, 930, 1000);



--CT-31203

--Adding permissions of IVR Keypress Report to all accounts

UPDATE user_permissions SET reports_list = array_cat(reports_list, '{1141}') WHERE ct_user_id IN (SELECT ct_user_id FROM ct_user WHERE role_id = 1);

UPDATE user_permissions SET reports_list = array_cat(reports_list, '{1141}') WHERE ct_user_id IN (SELECT ct_user_id FROM ct_user WHERE role_id = 5);

UPDATE user_permissions SET reports_list = array_cat(reports_list, '{1141}') WHERE ct_user_id IN (SELECT ct_user_id FROM ct_user WHERE role_id = 4);

UPDATE user_permissions SET reports_list = array_cat(reports_list, '{1141}') WHERE ct_user_id IN (SELECT ct_user_id FROM ct_user WHERE role_id = 6);



--CT-27411

--Added for Caller Id is set to ODN

UPDATE ce_sp_fieldmap SET callflow_field = 'data.callflow.routable_type == ''SimpleRoute'' ? (data.callflow.dnis_as_cid ? req.body.caller_no : req.body.api_no ) : req.body.caller_no' WHERE id = 31;



--CT-32507

-- LDM component calls 

ALTER TABLE call_detail ADD COLUMN is_ldm boolean NOT NULL DEFAULT false;
ALTER TABLE call_detail ADD COLUMN ldm_component_id integer DEFAULT NULL;