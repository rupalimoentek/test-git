


ALTER TABLE phone_tier ADD COLUMN zuora_id VARCHAR(255) DEFAULT NULL;
ALTER TABLE phone_tier ADD COLUMN zuora_name VARCHAR(255) DEFAULT NULL;
CREATE INDEX phone_tier_zuora_id_idx ON phone_tier (zuora_id);

INSERT into phone_tier (tier, tier_name, number_cost, usage_cost) VALUES (10,'Vanity Number',120,0.05);
INSERT into phone_tier (tier, tier_name, number_cost, usage_cost) VALUES (11,'Canada Toll Free',120,0.05);
INSERT into phone_tier (tier, tier_name, number_cost, usage_cost) VALUES (12,'Puerto Rico Toll Free',120,0.05);
INSERT into phone_tier (tier, tier_name, number_cost, usage_cost) VALUES (13,'Premium Rate Center',120,0.05);

UPDATE phone_tier SET zuora_id='2c92a0fc5aacfadd015ac94890f0299a' , zuora_name='4201000 Toll Free' WHERE tier=1;
UPDATE phone_tier SET zuora_id='2c92a0fc5aacfadd015ac956029c21a7' , zuora_name='4201000 Canada Regular' WHERE tier=2;
UPDATE phone_tier SET zuora_id='2c92a0ff5aad0caa015ac97f134c6dd8' , zuora_name='4201000 Hawaii' WHERE tier=3;
UPDATE phone_tier SET zuora_id='2c92a0ff5aad0caa015ac97f03986db6' , zuora_name='4201000 Alaska' WHERE tier=4;

UPDATE phone_tier SET zuora_id='2c92a0ff5aad0caa015ac9550602296f' , zuora_name='4201000 Puerto Rico Regular' WHERE tier=5;
UPDATE phone_tier SET zuora_id='2c92a0ff5aad0ca7015ab019c1641122' , zuora_name='4201000 Vanity Number' WHERE tier=10;
UPDATE phone_tier SET zuora_id='2c92a0fe5aacfac3015ac94a75ab49fa' , zuora_name='4201000 Canada Toll Free' WHERE tier=11;
UPDATE phone_tier SET zuora_id='2c92a0ff5aad0caa015ac9500cfb767b' , zuora_name='4201000 Puerto Rico Toll Free' WHERE tier=12;

UPDATE phone_tier SET zuora_id='2c92a0fe5aacfabe015ac97ede53333e' , zuora_name='4201000 Premium Rate Center' WHERE tier=13;
UPDATE phone_tier SET zuora_id='2c92a0fd5aad0ca0015ac980cf603261' , zuora_name='4201000 True 800' WHERE tier=50;
UPDATE phone_tier SET zuora_id='2c92a0ff5aad0caa015ac9801ee77361' , zuora_name='4201000 Repeater' WHERE tier=51;
UPDATE phone_tier SET zuora_id='2c92a0ff5aad0caa015ac98075516fbc' , zuora_name='4201000 Sequential Numbers' WHERE tier=53;
