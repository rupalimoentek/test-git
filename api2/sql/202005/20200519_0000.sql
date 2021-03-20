
-- provisioned_route_history
CREATE TABLE provisioned_route_history (
  provisioned_route_history_id BIGSERIAL NOT NULL,
  provisioned_route_id INT NOT NULL REFERENCES provisioned_route (provisioned_route_id) ON DELETE CASCADE ON UPDATE CASCADE,
  provisioned_route_status status NOT NULL DEFAULT 'active'::status,
  number_id INT NOT NULL REFERENCES phone_number (number_id) ON DELETE CASCADE ON UPDATE CASCADE,
  org_unit_id INT NOT NULL REFERENCES org_unit (org_unit_id) ON DELETE CASCADE ON UPDATE CASCADE,
  start_date TIMESTAMP without time zone NOT NULL,
  end_date TIMESTAMP without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  total_days integer NOT NULL,
  provisioned_route_history_created TIMESTAMP without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (provisioned_route_history_id)
);

ALTER TABLE public.provisioned_route_history
  OWNER TO interact;
GRANT ALL ON TABLE public.provisioned_route_history TO interact;
GRANT SELECT ON TABLE public.provisioned_route_history TO looker;

CREATE INDEX provisioned_route_history_provisioned_route_history_id_idx ON provisioned_route_history (provisioned_route_history_id);

CREATE INDEX provisioned_route_history_provisioned_route_id_idx ON provisioned_route_history (provisioned_route_id);

CREATE INDEX provisioned_route_history_number_id_idx ON provisioned_route_history (number_id);

CREATE INDEX provisioned_route_history_org_unit_id_idx ON provisioned_route_history (org_unit_id);

CREATE INDEX provisioned_route_history_start_date_idx ON provisioned_route_history (start_date);

CREATE INDEX provisioned_route_history_end_date_idx ON provisioned_route_history (end_date);


-- phone_pool_history

CREATE TABLE phone_pool_history (
	phone_pool_history_id bigserial NOT NULL,
	pool_id int4 NOT NULL,
	provisioned_route_status status NOT NULL DEFAULT 'active'::status,
	provisioned_route_id int4 NOT NULL,
	org_unit_id int4 NOT NULL,
	start_date timestamp NOT NULL,
	end_date timestamp NOT NULL DEFAULT now(),
	total_days int4 NOT NULL,
	phone_pool_history_created timestamp NOT NULL DEFAULT now(),
	number_count int4 NOT NULL,
	CONSTRAINT phone_pool_history_pkey PRIMARY KEY (phone_pool_history_id)
);

ALTER TABLE public.phone_pool_history ADD CONSTRAINT phone_pool_history_org_unit_id_fkey FOREIGN KEY (org_unit_id) REFERENCES org_unit(org_unit_id) ON UPDATE CASCADE ON DELETE CASCADE;
ALTER TABLE public.phone_pool_history ADD CONSTRAINT phone_pool_history_pool_id_fkey FOREIGN KEY (pool_id) REFERENCES phone_pool(pool_id);
ALTER TABLE public.phone_pool_history ADD CONSTRAINT phone_pool_history_provisioned_route_id_fkey FOREIGN KEY (provisioned_route_id) REFERENCES provisioned_route(provisioned_route_id) ON UPDATE CASCADE ON DELETE CASCADE;

CREATE INDEX phone_pool_history_end_date_idx ON public.phone_pool_history USING btree (end_date);
CREATE INDEX phone_pool_history_org_unit_id_idx ON public.phone_pool_history USING btree (org_unit_id);
CREATE INDEX phone_pool_history_phone_pool_history_id_idx ON public.phone_pool_history USING btree (phone_pool_history_id);
CREATE INDEX phone_pool_history_pool_id_idx ON public.phone_pool_history USING btree (pool_id);
CREATE INDEX phone_pool_history_provisioned_route_id_idx ON public.phone_pool_history USING btree (provisioned_route_id);
CREATE INDEX phone_pool_history_provisioned_route_status_idx ON public.phone_pool_history USING btree (provisioned_route_status);
CREATE INDEX phone_pool_history_start_date_idx ON public.phone_pool_history USING btree (start_date);

ALTER TABLE public.phone_pool_history
OWNER TO interact;
GRANT ALL ON TABLE public.phone_pool_history TO interact;
GRANT SELECT ON TABLE public.phone_pool_history TO looker;

-- ct_user_history

CREATE TABLE ct_user_history (
ct_user_history_id BIGSERIAL NOT NULL,
ct_user_id INT NOT NULL REFERENCES ct_user (ct_user_id) ON DELETE CASCADE ON UPDATE CASCADE,
ct_user_status status NOT NULL DEFAULT 'active'::status,
start_date TIMESTAMP without time zone NOT NULL,
end_date TIMESTAMP without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
total_days integer NOT NULL,
ct_user_history_created TIMESTAMP without time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
PRIMARY KEY (ct_user_history_id)
);

ALTER TABLE public.ct_user_history
OWNER TO interact;
GRANT ALL ON TABLE public.ct_user_history TO interact;
GRANT SELECT ON TABLE public.ct_user_history TO looker;

CREATE INDEX ct_user_history_ct_user_history_id_idx ON ct_user_history (ct_user_history_id);

CREATE INDEX ct_user_history_ct_user_id_idx ON ct_user_history (ct_user_id);

CREATE INDEX ct_user_history_start_date_idx ON ct_user_history (start_date);

CREATE INDEX ct_user_history_end_date_idx ON ct_user_history (end_date);

