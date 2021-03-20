


ALTER TABLE phone_tier ADD COLUMN zuora_id VARCHAR(255) DEFAULT NULL;
ALTER TABLE phone_tier ADD COLUMN zuora_name VARCHAR(255) DEFAULT NULL;
CREATE INDEX phone_tier_zuora_id_idx ON phone_tier (zuora_id);

INSERT into phone_tier (tier, tier_name, number_cost, usage_cost) VALUES (10,'Vanity Number',120,0.05);
INSERT into phone_tier (tier, tier_name, number_cost, usage_cost) VALUES (11,'Canada Toll Free',120,0.05);
INSERT into phone_tier (tier, tier_name, number_cost, usage_cost) VALUES (12,'Puerto Rico Toll Free',120,0.05);
INSERT into phone_tier (tier, tier_name, number_cost, usage_cost) VALUES (13,'Premium Rate Center',120,0.05);

UPDATE phone_tier SET zuora_id='2c92c0f85a6b1352015a863c3c635dbd' , zuora_name='Toll Free' WHERE tier=1;
UPDATE phone_tier SET zuora_id='2c92c0f95a6b2281015a863402954054' , zuora_name='Canadian Regular' WHERE tier=2;
UPDATE phone_tier SET zuora_id='2c92c0f85a6b134e015a863825ba2971' , zuora_name='Hawaii' WHERE tier=3;
UPDATE phone_tier SET zuora_id='2c92c0f95a6b2280015a8636ce676c9b' , zuora_name='Alaska' WHERE tier=4;

UPDATE phone_tier SET zuora_id='2c92c0f95a6b227b015a8639016e199d' , zuora_name='Puerto Rico Regular' WHERE tier=5;
UPDATE phone_tier SET zuora_id='2c92c0f959d961e4015a112b91795c23' , zuora_name='Vanity Number' WHERE tier=10;
UPDATE phone_tier SET zuora_id='2c92c0f85a6b1352015a863b1f715a25' , zuora_name='Canadian Toll Free' WHERE tier=11;
UPDATE phone_tier SET zuora_id='2c92c0f85a6b134e015a8639f78c31eb' , zuora_name='Puerto Rico Toll Free' WHERE tier=12;

UPDATE phone_tier SET zuora_id='2c92c0f85a6b139f015a863556f97eee' , zuora_name='Premium Rate Center' WHERE tier=13;
UPDATE phone_tier SET zuora_id='2c92c0f959d961e8015a1131142e27be' , zuora_name='True 800' WHERE tier=50;
UPDATE phone_tier SET zuora_id='2c92c0f95a6b2280015a8631bd2356cc' , zuora_name='Repeater' WHERE tier=51;
UPDATE phone_tier SET zuora_id='2c92c0f859d9576e015a112eab793d41' , zuora_name='Sequential Numbers' WHERE tier=53;
