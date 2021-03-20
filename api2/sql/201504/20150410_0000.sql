ALTER TABLE call_action DROP COLUMN phone_number_id;

DELETE FROM call_action;
ALTER TABLE call_action ADD COLUMN provisioned_route_id INT NOT NULL REFERENCES provisioned_route (provisioned_route_id) ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE call_action ADD COLUMN webhook_id INT DEFAULT NULL REFERENCES webhook (webhook_id) ON DELETE SET NULL ON UPDATE CASCADE;
