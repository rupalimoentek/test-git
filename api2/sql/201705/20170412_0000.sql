CREATE TYPE custom_source_type AS ENUM ('CS1','CS2','CS3','CS4','CS5');
ALTER TABLE callflow_custom_source ADD COLUMN custom_source_type custom_source_type NOT NULL DEFAULT 'CS1';
ALTER TABLE call_custom_source ADD COLUMN custom_source_type custom_source_type NOT NULL DEFAULT 'CS1';
