CREATE TABLE ivr_option (
	ivr_option_id 			serial NOT NULL,
	ivr_option	 			smallint NOT NULL,
	provisioned_route_id	integer NOT NULL,
	option_name				varchar(255) NOT NULL,
	PRIMARY KEY (ivr_option_id )
);

ALTER TABLE ONLY ivr_option
    ADD CONSTRAINT ivr_option_provisioned_route_id_fkey FOREIGN KEY (provisioned_route_id) REFERENCES provisioned_route(provisioned_route_id) ON UPDATE CASCADE ON DELETE CASCADE;