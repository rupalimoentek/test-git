-- remove old table
DROP TABLE npanxx_city;
-- create new table schema
CREATE TABLE npanxx_city (
    city_id 		bigserial NOT NULL,
    npanxx          character varying(6),
    npa             integer,
    nxx             integer,
    zipcode         character varying(10),
    state           character varying(2),
    city            character varying(30),
    rc              character varying(20),
    lata            character varying(10),
    latitude        character varying(20),
    longitude       character varying(20),
    PRIMARY KEY (city_id)
);
