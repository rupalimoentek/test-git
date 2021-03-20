CREATE TABLE call_keywords
(
  call_id integer,
  keyword character varying(512) NOT NULL,
  CONSTRAINT call_keywords_call_id_fkey FOREIGN KEY (call_id)
      REFERENCES call (call_id) MATCH SIMPLE
      ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT call_keywords_call_id_key UNIQUE (call_id)
);