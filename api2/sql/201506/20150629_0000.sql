-- fixes for PostgreSQL XL
ALTER TABLE doubleclick_metric DROP CONSTRAINT doubleclick_metric_dc_call_id_fkey;
ALTER TABLE doubleclick_call DROP CONSTRAINT doubleclick_call_pkey;
ALTER TABLE doubleclick_call DROP COLUMN dc_call_id;
ALTER TABLE doubleclick_metric RENAME dc_call_id TO call_id;
ALTER TABLE doubleclick_call ADD PRIMARY KEY (call_id);
ALTER TABLE doubleclick_metric ADD CONSTRAINT doubleclick_metric_call_id_fkey FOREIGN KEY (call_id) REFERENCES doubleclick_call (call_id);

ALTER TABLE doubleclick_metric DROP COLUMN call_metric_id;

ALTER TABLE comment DROP CONSTRAINT comment_comment_parent_id_fkey;

ALTER TABLE org_billing ADD COLUMN data_append BOOLEAN NOT NULL DEFAULT false;
ALTER TYPE status ADD VALUE 'suspended' AFTER 'deleted';


DROP TABLE doubleclick_metric;
CREATE TABLE doubleclick_metric (
    call_id 				    BIGINT NOT NULL REFERENCES call (call_id) ON DELETE CASCADE ON UPDATE CASCADE,
    indicator_id 			    INT DEFAULT NULL REFERENCES indicator (indicator_id) ON DELETE SET NULL ON UPDATE CASCADE,
    floodlight_var			    VARCHAR(64) NOT NULL,
    metric_field 			    VARCHAR(64),
    metric_value 			    VARCHAR(64),
    map_type 				    dc_map_type NOT NULL DEFAULT 'metric'
) DISTRIBUTE BY HASH(call_id);


