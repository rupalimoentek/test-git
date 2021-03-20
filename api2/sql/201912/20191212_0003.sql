scp /home/amrita/2019-05-DeluxeAreaCodeDatabase.csv moentek@stag-5-pg-1.convirza.com:/tmp

2. ssh moentek@stag-5-pg-1.convirza.com

3. created one dummy table as npanxx_city_dummy with columns as header columns of csv file.

CREATE TABLE public.npanxx_city_dummy(
    npa character varying(250),
    nxx character varying(250),
    countypop character varying(250),
    zipcodecount character varying(250),
    zipcodefreq character varying(250),
    latitude character varying(250),
    longitude character varying(250),
    state character varying(250),
    city character varying(250),
    county character varying(250),
    timezone character varying(250),
    observesdst character varying(250),
    nxxusetype character varying(250),
    nxxintroversion character varying(250),
    zipcode character varying(250),
    npanew character varying(250),
    fips character varying(250),
    lata character varying(250),
    overlay character varying(250),
    rc character varying(250),
    switchclli character varying(250),
    msa_cbsa character varying(250),
    msa_cbsa_code character varying(250),
    ocn character varying(250),
    company character varying(250),
    coverageareaname character varying(250),
    npanxx character varying(250),
    flags character varying(250),
    status character varying(250),
    weightedlat character varying(250),
    weightedlon character varying(250)
);


ALTER TABLE public.npanxx_city_dummy OWNER TO interact;

4.COPY npanxx_city_dummy FROM '/tmp/2019-05-DeluxeAreaCodeDatabase.csv' DELIMITER ',' CSV HEADER; -> Result -> 500961

CREATE TABLE public.npanxx_city
(
  city_id SERIAL NOT NULL ,
  npanxx integer,
  npa smallint,
  nxx smallint,
  zipcode character varying(10),
  state character varying(2),
  city character varying(30),
  rc character varying(200),
  lata integer,
  latitude character varying(200),
  longitude character varying(200),
  country character(2) DEFAULT NULL::bpchar,
  CONSTRAINT npannx_city_pkey PRIMARY KEY (city_id)
)
WITH (
  OIDS=FALSE
);
ALTER TABLE public.npanxx_city
  OWNER TO interact;
GRANT ALL ON TABLE public.npanxx_city TO interact;
GRANT ALL ON TABLE public.npanxx_city TO moentekdbrw;
GRANT SELECT ON TABLE public.npanxx_city TO moentekdbro;
GRANT SELECT ON TABLE public.npanxx_city TO looker;




---------------------------------

CREATE TABLE public.npanxx_city_small
(
  zipcode text,
  npanxx integer,
  state character varying(2),
  city text,
  country character(2)
)
WITH (
  OIDS=FALSE
);
ALTER TABLE public.npanxx_city_small
  OWNER TO interact;
GRANT ALL ON TABLE public.npanxx_city_small TO interact;
GRANT ALL ON TABLE public.npanxx_city_small TO moentekdbrw;
GRANT SELECT ON TABLE public.npanxx_city_small TO moentekdbro;
GRANT SELECT ON TABLE public.npanxx_city_small TO looker;

-- Index: public.npanxx_idx

-- DROP INDEX public.npanxx_idx;

CREATE INDEX npanxx_idx
  ON public.npanxx_city_small
  USING btree
  (npanxx);

------------------------------

CREATE TABLE public.geo_lookup
(
  id SERIAL NOT NULL ,
  npa character(3) NOT NULL,
  nxx character(3) NOT NULL,
  npanxx character(6) NOT NULL,
  zipcode character(5) NOT NULL,
  state character(2) NOT NULL,
  city character varying(128) NOT NULL,
  county character varying(100) DEFAULT NULL::character varying,
  rc character(10) NOT NULL,
  latitude numeric(16,3) NOT NULL,
  longitude numeric(16,3) NOT NULL,
  CONSTRAINT geo_lookup_pkey PRIMARY KEY (id)
)
WITH (
  OIDS=FALSE
);
ALTER TABLE public.geo_lookup
  OWNER TO interact;
GRANT ALL ON TABLE public.geo_lookup TO interact;
GRANT ALL ON TABLE public.geo_lookup TO moentekdbrw;
GRANT SELECT ON TABLE public.geo_lookup TO moentekdbro;
GRANT SELECT ON TABLE public.geo_lookup TO looker;

-- Index: public.geo_lookup_city_idx

-- DROP INDEX public.geo_lookup_city_idx;

CREATE INDEX geo_lookup_city_idx
  ON public.geo_lookup
  USING btree
  (city COLLATE pg_catalog."default");

-- Index: public.geo_lookup_npa_nxx_idx

-- DROP INDEX public.geo_lookup_npa_nxx_idx;

CREATE INDEX geo_lookup_npa_nxx_idx
  ON public.geo_lookup
  USING btree
  (npa COLLATE pg_catalog."default", nxx COLLATE pg_catalog."default");

-- Index: public.geo_lookup_npanxx_idx

-- DROP INDEX public.geo_lookup_npanxx_idx;

CREATE INDEX geo_lookup_npanxx_idx
  ON public.geo_lookup
  USING btree
  (npanxx COLLATE pg_catalog."default");


---------------------------------

-- Table: public.ce_geo_lookup

-- DROP TABLE public.ce_geo_lookup;

CREATE TABLE public.ce_geo_lookup
(
  npa character varying(3),
  nxx character varying(3),
  zip character varying(5),
  state character varying(2),
  city character varying(128),
  rc character varying(100),
  latitude double precision,
  longitude double precision
)
WITH (
  OIDS=FALSE
);
ALTER TABLE public.ce_geo_lookup
  OWNER TO interact;
GRANT ALL ON TABLE public.ce_geo_lookup TO interact;
GRANT SELECT ON TABLE public.ce_geo_lookup TO looker;

-- Index: public.ce_geo_lookup_city_idx

-- DROP INDEX public.ce_geo_lookup_city_idx;

CREATE INDEX ce_geo_lookup_city_idx
  ON public.ce_geo_lookup
  USING btree
  (city COLLATE pg_catalog."default");

-- Index: public.ce_geo_lookup_npa_idx

-- DROP INDEX public.ce_geo_lookup_npa_idx;

CREATE INDEX ce_geo_lookup_npa_idx
  ON public.ce_geo_lookup
  USING btree
  (npa COLLATE pg_catalog."default");

-- Index: public.ce_geo_lookup_nxx_idx

-- DROP INDEX public.ce_geo_lookup_nxx_idx;

CREATE INDEX ce_geo_lookup_nxx_idx
  ON public.ce_geo_lookup
  USING btree
  (nxx COLLATE pg_catalog."default");

-- Index: public.ce_geo_lookup_rc_idx

-- DROP INDEX public.ce_geo_lookup_rc_idx;

CREATE INDEX ce_geo_lookup_rc_idx
  ON public.ce_geo_lookup
  USING btree
  (rc COLLATE pg_catalog."default");

-- Index: public.ce_geo_lookup_zip_idx

-- DROP INDEX public.ce_geo_lookup_zip_idx;

CREATE INDEX ce_geo_lookup_zip_idx
  ON public.ce_geo_lookup
  USING btree
  (zip COLLATE pg_catalog."default");


--------------------------------

-- Table: public.ce_npanxx

-- DROP TABLE public.ce_npanxx;

CREATE TABLE public.ce_npanxx
(
  npa character varying(3) NOT NULL DEFAULT ''::character varying,
  nxx character varying(3) NOT NULL DEFAULT ''::character varying,
  block_id character varying(1),
  tbp_ind character varying(1) DEFAULT NULL::character varying,
  lata character varying(5) DEFAULT NULL::character varying,
  ltype character varying(1) DEFAULT NULL::character varying,
  contam character varying(1) DEFAULT NULL::character varying,
  state character varying(100) DEFAULT NULL::character varying,
  country character varying(2) DEFAULT NULL::character varying,
  wcold character varying(128) DEFAULT NULL::character varying,
  switch character varying(11) DEFAULT NULL::character varying,
  rcstatus character varying(100) DEFAULT NULL::character varying,
  rctype character varying(1) DEFAULT NULL::character varying,
  wc character varying(10) DEFAULT NULL::character varying,
  tz character varying(2) DEFAULT NULL::character varying,
  dst character varying(1) DEFAULT NULL::character varying,
  zip character varying(5) DEFAULT NULL::character varying,
  zip2 character varying(5) DEFAULT NULL::character varying,
  zip3 character varying(5) DEFAULT NULL::character varying,
  zip4 character varying(5) DEFAULT NULL::character varying,
  fips character varying(5) DEFAULT NULL::character varying,
  fips2 character varying(5) DEFAULT NULL::character varying,
  fips3 character varying(5) DEFAULT NULL::character varying,
  cbsa character varying(5) DEFAULT NULL::character varying,
  cbsa2 character varying(5) DEFAULT NULL::character varying,
  msa character varying(4) DEFAULT NULL::character varying,
  pmsa character varying(4) DEFAULT NULL::character varying,
  latitude double precision NOT NULL DEFAULT '0'::double precision,
  longitude double precision NOT NULL DEFAULT '0'::double precision,
  ocn_category character varying(1) DEFAULT NULL::character varying,
  ocn character varying(4) DEFAULT NULL::character varying,
  derived_from_npa character varying(3) DEFAULT NULL::character varying,
  newnpa character varying(20) DEFAULT NULL::character varying,
  "overlay" character varying(1) DEFAULT NULL::character varying
)
WITH (
  OIDS=FALSE
);
ALTER TABLE public.ce_npanxx
  OWNER TO interact;
GRANT ALL ON TABLE public.ce_npanxx TO interact;
GRANT SELECT ON TABLE public.ce_npanxx TO looker;

-- Index: public.ce_npanxx_npa_idx

-- DROP INDEX public.ce_npanxx_npa_idx;

CREATE INDEX ce_npanxx_npa_idx
  ON public.ce_npanxx
  USING btree
  (npa COLLATE pg_catalog."default");

-- Index: public.ce_npanxx_nxx_idx

-- DROP INDEX public.ce_npanxx_nxx_idx;

CREATE INDEX ce_npanxx_nxx_idx
  ON public.ce_npanxx
  USING btree
  (nxx COLLATE pg_catalog."default");


5.Altered some fields datatype of original one npanxx_city as they were not of sufficient length -

ALTER TABLE npanxx_city ALTER COLUMN latitude type VARCHAR(200);
ALTER TABLE npanxx_city ALTER COLUMN longitude type VARCHAR(200);
ALTER TABLE npanxx_city ALTER COLUMN rc type VARCHAR(200);

INSERT INTO npanxx_city(npanxx,npa,nxx,zipcode,state,city,rc,lata,latitude,longitude)
SELECT CAST(ncd.npa||ncd.nxx AS INTEGER), CAST(ncd.npa AS smallint),CAST(ncd.nxx AS smallint),ncd.zipcode,ncd.state,ncd.city,ncd.rc,CAST(ncd.lata AS INTEGER),ncd.latitude,ncd.longitude
FROM   npanxx_city_dummy ncd
WHERE  NOT EXISTS (SELECT nc.npa,nc.nxx,nc.zipcode,nc.state,nc.city,nc.rc,nc.lata,nc.latitude,nc.longitude FROM npanxx_city nc WHERE nc.npa::varchar = ncd.npa AND nc.nxx::varchar = ncd.nxx);

INSERT INTO npanxx_city_small(zipcode,npanxx,state,city)
SELECT ncd.zipcode,ncd.npa||ncd.nxx,ncd.state,ncd.city
FROM   npanxx_city_dummy ncd
WHERE  NOT EXISTS (SELECT nc.zipcode,nc.npanxx,nc.state,nc.city FROM npanxx_city_small nc WHERE nc.zipcode = ncd.zipcode);
OR
INSERT INTO npanxx_city_small(zipcode,npanxx,state,city)
SELECT ncd.zipcode,(ncd.npa||ncd.nxx)::integer,ncd.state,ncd.city
FROM   npanxx_city_dummy ncd
WHERE  NOT EXISTS (SELECT nc.zipcode,nc.npanxx,nc.state,nc.city FROM npanxx_city_small nc WHERE nc.zipcode = ncd.zipcode);

INSERT INTO geo_lookup(npa,nxx,npanxx,zipcode,state,city,county,rc,latitude,longitude)
SELECT ncd.npa,ncd.nxx,ncd.npa||ncd.nxx, ncd.zipcode,ncd.state,ncd.city,ncd.county,ncd.rc,ncd.latitude::numeric,ncd.longitude::numeric
FROM   npanxx_city_dummy ncd
WHERE  NOT EXISTS (SELECT gl.npa,gl.nxx,gl.zipcode,gl.state,gl.city,gl.county,gl.rc,gl.latitude,gl.longitude FROM geo_lookup gl WHERE gl.npa = ncd.npa
AND gl.nxx = ncd.nxx)
AND ncd.zipcode IS NOT NULL AND ncd.rc IS NOT NULL;

ALTER TABLE ce_geo_lookup ALTER COLUMN rc type VARCHAR(100);

INSERT INTO ce_geo_lookup(npa,nxx,zip,state,city,rc,latitude,longitude)
SELECT ncd.npa,ncd.nxx,ncd.zipcode,ncd.state,ncd.city,ncd.rc,ncd.latitude::double precision,ncd.longitude::double precision
FROM   npanxx_city_dummy ncd
WHERE  NOT EXISTS (SELECT gl.npa,gl.nxx,gl.zip,gl.state,gl.city,gl.rc,gl.latitude,gl.longitude FROM ce_geo_lookup gl WHERE gl.npa = ncd.npa
AND gl.nxx = ncd.nxx);

ALTER TABLE ce_npanxx ALTER COLUMN state type VARCHAR(100);
ALTER TABLE ce_npanxx ALTER COLUMN rcstatus type VARCHAR(100);
ALTER TABLE ce_npanxx ALTER COLUMN block_id DROP NOT NULL;

INSERT INTO ce_npanxx(npa,nxx,lata,state,rcstatus,zip,latitude,longitude,ocn)
SELECT ncd.npa,ncd.nxx,ncd.lata,ncd.state,ncd.status,ncd.zipcode,ncd.latitude::double precision,ncd.longitude::double precision,ncd.ocn
FROM   npanxx_city_dummy ncd
WHERE  NOT EXISTS (SELECT
gl.npa,
gl.nxx,
gl.lata,
gl.state,
gl.rcstatus,
gl.zip,
gl.latitude,
gl.longitude,
gl.ocn
FROM ce_npanxx gl WHERE gl.npa = ncd.npa AND gl.nxx = ncd.nxx) ;

update ce_geo_lookup set longitude = longitude * -1 where state not in ('MP','GU') and longitude > 0;
update npanxx_city set longitude = '-' || longitude where cast(longitude as float) > 0 and state not in ('MP','GU');

update ce_npanxx set longitude = longitude * - 1 where longitude > 0 and state not in ('MP','GU');