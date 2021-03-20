-- storing a snapshot value of Ad Source
ALTER TABLE call_detail ADD COLUMN channel_id INT DEFAULT NULL REFERENCES channel (channel_id) ON UPDATE CASCADE ON DELETE SET NULL;
