
INSERT INTO subscription values (28,'Professional Exclusive Self Sign Up','','2c92a0fd60c505ec0160c7e294626035','t')

INSERT INTO subscription_component (subscription_id, component_id, component_quantity, component_threshold_max,component_ext_id)
values (28,2,1,99999999,'')
(28,3,1,99999999,''),
(28,4,1,0,''),
(28,5,1,10000,'2c92a0ff60c505d70160c811c80c11b3'),
(28,6,1,0,''),
(28,7,1,0,''),
(28,8,1,0,''),
(28,9,1,0,''),
(28,10,1,9999999,''),
(28,11,1,0,''),
(28,12,1,0,''),
(28,13,1,0,''),
(28,16,1,0,''),
(28,17,1,0,''),
(28,18,1,3000,'2c92a0fd60c505ec0160c7e295146041'),
(28,19,1,0,'2c92a0fe60c4fdd70160c7ee12ed0bee'),
(28,21,10000,0,'2c92a0fd60c505ec0160c7e294d7603d'),
(28,22,1,500,'2c92a0ff60c505db0160c80db8cc7d2e'),
(28,23,1,0,''),
(28,24,1,0,''),
(28,26,1,0,''),
(28,27,1,0,'')



update subscription set subscription_name='Standard Exclusive' where subscription_id =26

update subscription_component set component_ext_id='2c92a0f94d5239ac014d5643f979094d' where subscription_id =26 AND component_id=5

update subscription_component set component_ext_id='2c92a0fb4d5241e5014d5643c9fd623f' where subscription_id =26 AND component_id=21

update subscription_component set component_ext_id='2c92a0f94f734496014f85674b6d34f8' where subscription_id =26 AND component_id=18

