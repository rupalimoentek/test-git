-- main white label table
CREATE TABLE org_white_label (
	org_unit_id 					INT NOT NULL REFERENCES org_unit (org_unit_id) ON DELETE CASCADE ON UPDATE CASCADE,
	domain_name 					VARCHAR(128) DEFAULT NULL,
	support_url 					VARCHAR(128) DEFAULT NULL,
	chat_url 						VARCHAR(128) DEFAULT NULL,
	org_logo 						VARCHAR(255) DEFAULT NULL,
	chat_active 					BOOLEAN NOT NULL DEFAULT false,
	white_label_active 				BOOLEAN NOT NULL DEFAULT false,
	white_label_css 				JSON,
	PRIMARY KEY (org_unit_id)
);
CREATE INDEX org_white_label_domain_name_active_idx ON org_white_label (domain_name, white_label_active);
CREATE INDEX org_white_label_org_unit_id_active_idx ON org_white_label (org_unit_id, white_label_active);

INSERT INTO component (component_name, component_desc) VALUES ('White Label', 'Rebranding and style customizations for GUI');
-- pri key should be 25

INSERT INTO scope (scope_code, scope_display, scope_desc) VALUES ('white', 'White Label', 'Rebranding and styling for GUI');
-- pri key should be 30

INSERT INTO role_access (role_id, scope_id, component_id, permission) VALUES ('1', '30', '25', '7'), ('4', '30', '25', '7');

CREATE TABLE email_master (
	master_id 						SERIAL NOT NULL,
	email_code 						VARCHAR(32) NOT NULL,
	email_name 						VARCHAR(64) NOT NULL,
	email_desc 						VARCHAR(255),
	email_active 					BOOLEAN NOT NULL DEFAULT true,
	dynamic_field 					VARCHAR(64)[],
	field_display 					VARCHAR(128)[],
	html_template 					TEXT,
	text_template 					TEXT,
	email_created 					DATE NOT NULL DEFAULT NOW(),
	email_modified 					DATE DEFAULT NULL,
	PRIMARY KEY (master_id)
);
COMMENT ON COLUMN email_master.dynamic_field IS 'this is the actual name of the variable that would be used for substitution';
COMMENT ON COLUMN email_master.field_display IS 'what is shown customer facing for the matching variable from dynamic_field';

CREATE TABLE email_template (
	email_id 						SERIAL NOT NULL,
	master_id 						INT NOT NULL REFERENCES email_master (master_id) ON DELETE CASCADE ON UPDATE CASCADE,
	org_unit_id 					INT NOT NULL REFERENCES org_unit (org_unit_id) ON DELETE CASCADE ON UPDATE CASCADE,
	subject 						VARCHAR(128),
	reply_to 						VARCHAR(128),
	email_from						VARCHAR(128),
	html_copy 						TEXT,
	text_copy 						TEXT,
	PRIMARY KEY (email_id)
);

ALTER TABLE org_white_label ADD CONSTRAINT org_white_label_domain_name_key UNIQUE (domain_name);
ALTER TABLE email_master ADD CONSTRAINT email_master_email_code_key UNIQUE (email_code);

ALTER TABLE email_master ADD COLUMN email_subject VARCHAR(128);
ALTER TABLE email_master DROP COLUMN text_template;
ALTER TABLE email_template DROP COLUMN text_copy;