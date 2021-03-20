-- Added columns for Geo routes custom promts
ALTER TABLE ce_geo_routes ADD COLUMN message character varying(255) DEFAULT NULL::character varying;
ALTER TABLE ce_geo_routes ADD COLUMN message_enabled boolean DEFAULT false;