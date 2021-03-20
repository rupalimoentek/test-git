-- alter admin permissions for orgunit
UPDATE role_access SET permission=7 WHERE role_id=1 AND scope_id=22;

-- update time zone method in user profile
UPDATE ct_user_detail SET timezone='MST';
