ALTER TABLE dni_setting DROP COLUMN dni_ttl;

CREATE TABLE ct_user_detail (
    ct_user_id integer NOT NULL,
    primary_phone character varying(45),
    mobile_phone character varying(45),
    user_created timestamp without time zone DEFAULT ('now'::text)::date NOT NULL,
    user_modified timestamp without time zone,
    user_img character varying(255),
    add_to_campaigns boolean DEFAULT false NOT NULL,
    has_changed_pw boolean DEFAULT false NOT NULL,
    time_zone_id smallint
);

ALTER TABLE ONLY ct_user_detail
    ADD CONSTRAINT ct_user_detail_pkey PRIMARY KEY (ct_user_id);

ALTER TABLE ONLY ct_user_detail
    ADD CONSTRAINT ct_user_detail_ct_user_id_fkey FOREIGN KEY (ct_user_id) REFERENCES ct_user(ct_user_id) ON UPDATE CASCADE ON DELETE CASCADE;
	
ALTER TABLE ct_user
	DROP COLUMN has_changed_pw,
	DROP COLUMN primary_phone,
	DROP COLUMN mobile_phone,
	DROP COLUMN user_created,
	DROP COLUMN user_modified,
	DROP COLUMN add_to_campaigns,
	DROP COLUMN mobile_provider_id,
	DROP COLUMN user_img;