CREATE TABLE email_list (
	list_id 				SERIAL NOT NULL,
	org_unit_id 			INT NOT NULL REFERENCES org_unit (org_unit_id) ON DELETE CASCADE ON UPDATE CASCADE,
	list_name 				VARCHAR(64) NOT NULL,
	from_label 				VARCHAR(64) DEFAULT NULL,
	owner_user_id 			BIGINT NOT NULL REFERENCES ct_user (ct_user_id) ON DELETE CASCADE ON UPDATE CASCADE,
	list_created 			TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
	list_updated 			TIMESTAMP(0) WITHOUT TIME ZONE DEFAULT NULL,
	PRIMARY KEY (list_id)
);

CREATE OR REPLACE RULE get_pkey_on_insert AS
    ON INSERT TO email_list DO  SELECT currval('email_list_list_id_seq'::text::regclass) AS list_id;

CREATE TABLE email_recipient (
	recipient_id 			SERIAL NOT NULL,
	list_id 				INT NOT NULL REFERENCES email_list (list_id) ON DELETE CASCADE ON UPDATE CASCADE,
	campaign_id 			INT DEFAULT NULL REFERENCES campaign (campaign_id) ON DELETE CASCADE ON UPDATE CASCADE,
	ct_user_id 				INT DEFAULT NULL REFERENCES ct_user (ct_user_id) ON DELETE CASCADE ON UPDATE CASCADE,
	dist_list_id 			INT DEFAULT NULL REFERENCES email_list (list_id) ON DELETE CASCADE ON UPDATE CASCADE,
	email_address 			VARCHAR(64) DEFAULT NULL,
	recipient_added 		DATE NOT NULL DEFAULT CURRENT_DATE,
	recipient_dnc	 		BOOLEAN NOT NULL DEFAULT false,
	CHECK ((campaign_id IS NOT NULL AND ct_user_id IS NULL AND email_address IS NULL AND dist_list_id IS NULL) OR
		   (ct_user_id IS NOT NULL AND campaign_id IS NULL AND email_address IS NULL AND dist_list_id IS NULL) OR
		   (email_address IS NOT NULL AND campaign_id IS NULL AND ct_user_id IS NULL AND dist_list_id IS NULL) OR
		   (dist_list_id IS NOT NULL AND email_address IS NULL AND campaign_id IS NULL AND ct_user_id IS NULL)),
	PRIMARY KEY (recipient_id)
);
CREATE INDEX email_recipient_recipient_dnc_idx ON email_recipient (recipient_dnc);