-- add changes for webhooks
ALTER TABLE webhook ADD COLUMN include_dni BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE webhook ADD COLUMN include_score BOOLEAN NOT NULL DEFAULT false;
