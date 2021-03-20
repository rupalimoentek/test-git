GRANT SELECT, UPDATE, INSERT, DELETE ON npanxx_city TO interact;
GRANT SELECT, UPDATE ON npanxx_city_city_id_seq TO interact;
-- import data into table

-- these changes actually came later after the table was created
ALTER TABLE npanxx_city ALTER COLUMN npanxx SET DATA TYPE INT USING npanxx::integer;
ALTER TABLE npanxx_city ALTER COLUMN npa SET DATA TYPE SMALLINT;
ALTER TABLE npanxx_city ALTER COLUMN nxx SET DATA TYPE SMALLINT;
ALTER TABLE npanxx_city ALTER COLUMN city_id SET DATA TYPE INT;
ALTER TABLE npanxx_city ALTER COLUMN lata SET DATA TYPE INT USING lata::integer;

VACUUM (VERBOSE, FULL, ANALYZE) npanxx_city;
REINDEX (VERBOSE) TABLE npanxx_city;

-- this one may fail if it already exists, which is fine
CREATE INDEX npanxx_city_npanxx_idx ON npanxx_city (npanxx);