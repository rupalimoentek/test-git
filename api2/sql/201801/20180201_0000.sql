ALTER TABLE reports ADD COLUMN is_admin_only boolean NOT NULL DEFAULT false;

UPDATE reports SET is_admin_only = TRUE WHERE report_id IN (1112,1134);
