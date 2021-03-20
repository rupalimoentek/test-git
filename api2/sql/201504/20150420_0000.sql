CREATE TABLE time_zone (
    time_zone_id integer NOT NULL,
    time_zone_name character varying(50) NOT NULL,
    time_zone_abbreviation character varying(10) NOT NULL,
    utc smallint NOT NULL,
    time_zone_alias character varying(255) NOT NULL
);

CREATE SEQUENCE time_zone_time_zone_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE time_zone_time_zone_id_seq OWNED BY time_zone.time_zone_id;

ALTER TABLE ONLY time_zone ALTER COLUMN time_zone_id SET DEFAULT nextval('time_zone_time_zone_id_seq'::regclass);

ALTER TABLE ONLY time_zone ADD CONSTRAINT time_zone_pkey PRIMARY KEY (time_zone_id);