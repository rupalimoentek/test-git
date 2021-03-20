-- Foreign table alter querues to add 2 new coulmns for referral number and referral data.

ALTER FOREIGN TABLE IF EXISTS call_flows ADD COLUMN referral_number varchar(20);


ALTER FOREIGN TABLE IF EXISTS call_flows ADD COLUMN referral_date TIMESTAMP(0) WITHOUT TIME ZONE;
