ALTER TABLE ce_schedule_routes ADD COLUMN vm_enabled boolean DEFAULT false;

ALTER TABLE ce_schedule_routes ADD COLUMN default_ringto character varying(255) DEFAULT NULL;

ALTER TYPE  ivr_option_type ADD VALUE 'schedule' AFTER 'interactiveVoice'; 
