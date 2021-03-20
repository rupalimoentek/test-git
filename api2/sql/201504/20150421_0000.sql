
-- New column used for password recovery and new user login
ALTER TABLE ct_user_detail ADD COLUMN pass_recover CHAR(32);
