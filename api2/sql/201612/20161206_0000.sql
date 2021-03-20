ALTER TABLE campaign ADD COLUMN referral_number VARCHAR(10) DEFAULT NULL;
ALTER TYPE status ADD VALUE 'referral' AFTER 'suspended';
ALTER TYPE phstatus ADD VALUE 'referral' AFTER 'reserved';
ALTER TABLE provisioned_route ADD COLUMN referral_end_date timestamp with time zone;