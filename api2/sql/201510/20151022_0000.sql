-- new subscription for PRODUCTION
INSERT INTO subscription (subscription_name, subscription_desc, subscription_external_id) VALUES ('Test Drive', 'Introduction evaluation pricing model', '2c92a0fa501f2f3f01502424b3ac4fed');
-- pri key should be 11

INSERT INTO subscription_component (subscription_id, component_id, component_threshold_max, component_ext_id) VALUES
	('11', '21', '9999999', '2c92a0fa501f2f3f01502424b4254ffb'),
	('11', '18', '9999999', '2c92a0fa501f2f3f01502424b4775003'),
	('11', '22', '9999999', '2c92a0fa501f2f3f01502424b58a5033');

INSERT INTO subscription_component (subscription_id, component_id) VALUES
	('11', '2'),
	('11', '3'),
	('11', '4'),
	('11', '5'),
	('11', '6'),
	('11', '7'),
	('11', '8'),
	('11', '9'),
	('11', '12'),
	('11', '16'),
	('11', '17'),
	('11', '23'),
	('11', '24');

DELETE FROM subscription_component WHERE subscription_id=8 AND component_id=1;
DELETE FROM subscription_component WHERE subscription_id=8 AND component_id=20;
INSERT INTO subscription_component (subscription_id, component_id) VALUES ('8', '17');

UPDATE subscription_component SET component_threshold_max=9999999 WHERE subscription_id=11 AND component_id=2;
UPDATE subscription_component SET component_threshold_max=9999999 WHERE subscription_id=11 AND component_id=3;
UPDATE subscription_component SET component_threshold_max=9999999 WHERE subscription_id=11 AND component_id=5;

UPDATE subscription_component SET component_ext_id=NULL WHERE subscription_id=8 AND component_id=5;
UPDATE subscription_component SET component_ext_id=NULL WHERE subscription_id=9 AND component_id=5;
UPDATE subscription_component SET component_ext_id=NULL WHERE subscription_id=10 AND component_id=5;

UPDATE subscription_component SET component_ext_id='2c92a0fb4e86a5fe014eb663b0790dc3' WHERE subscription_id=8 AND component_id=5;
UPDATE subscription_component SET component_ext_id='2c92a0fb5078c2d0015081a08f2d7b93' WHERE subscription_id=9 AND component_id=5;
UPDATE subscription_component SET component_ext_id='2c92a0fb5078c2d00150819defbd7118' WHERE subscription_id=10 AND component_id=5;
UPDATE subscription_component SET component_ext_id='2c92a0fa501f2f3f01502424b4775003' WHERE subscription_id=11 AND component_id=5;

-- new subscription for STAGING / DEVELOPMENT
-- INSERT INTO subscription (subscription_name, subscription_desc, subscription_external_id) VALUES ('Test Drive', 'Introduction evaluation pricing model', '2c92c0f8501d4405015024530a5b6e85');
-- pri key should be 11

-- INSERT INTO subscription_component (subscription_id, component_id, component_threshold_max, component_ext_id) VALUES
--	('11', '18', '9999999', '2c92c0f8501d4405015024530e446e88'),
--	('11', '21', '9999999', '2c92c0f8501d44050150245310386e9b'),
--	('11', '22', '9999999', '2c92c0f8501d44050150245310e16e9f');

-- INSERT INTO subscription_component (subscription_id, component_id) VALUES
--	('11', '2'),
--	('11', '3'),
--	('11', '4'),
-- 	('11', '5'),
--	('11', '6'),
--	('11', '7'),
--	('11', '8'),
--	('11', '9'),
--	('11', '12'),
--	('11', '16'),
--	('11', '17'),
--	('11', '20'),
--	('11', '23'),
--	('11', '24');

-- DELETE FROM subscription_component WHERE subscription_id=8 AND component_id=1;
-- DELETE FROM subscription_component WHERE subscription_id=8 AND component_id=20;
-- INSERT INTO subscription_component (subscription_id, component_id) VALUES ('8', '17');

-- UPDATE subscription_component SET component_threshold_max=9999999 WHERE subscription_id=11 AND component_id=2;
-- UPDATE subscription_component SET component_threshold_max=9999999 WHERE subscription_id=11 AND component_id=3;
-- UPDATE subscription_component SET component_threshold_max=9999999 WHERE subscription_id=11 AND component_id=5;

-- UPDATE subscription_component SET component_ext_id=NULL WHERE subscription_id=8 AND component_id=5;
-- UPDATE subscription_component SET component_ext_id=NULL WHERE subscription_id=9 AND component_id=5;
-- UPDATE subscription_component SET component_ext_id=NULL WHERE subscription_id=10 AND component_id=5;

-- UPDATE subscription_component SET component_ext_id='2c92c0f84cdf9966014ce93ae503460b' WHERE subscription_id=8 AND component_id=5;
-- UPDATE subscription_component SET component_ext_id='2c92c0f94cdfb2c5014ce93bb4da5e9a' WHERE subscription_id=9 AND component_id=5;
-- UPDATE subscription_component SET component_ext_id='2c92c0f94cdfb2c6014ce93eff6d5f09' WHERE subscription_id=10 AND component_id=5;
-- UPDATE subscription_component SET component_ext_id='2c92c0f8501d4405015024530f6c6e8c' WHERE subscription_id=11 AND component_id=5;