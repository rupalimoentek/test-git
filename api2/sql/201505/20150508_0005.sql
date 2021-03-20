--
-- PostgreSQL database dump
--

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;

SET search_path = public, pg_catalog;

SET default_tablespace = '';

SET default_with_oids = false;

--
-- Name: report_home; Type: TABLE; Schema: public; Owner: interact; Tablespace: 
--

CREATE TABLE report_home (
    rh_id bigint NOT NULL,
    org_unit_id integer,
    rh_date timestamp with time zone,
    rh_json json
);


ALTER TABLE public.report_home OWNER TO interact;

--
-- Name: report_home_rh_id_seq; Type: SEQUENCE; Schema: public; Owner: interact
--

CREATE SEQUENCE report_home_rh_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.report_home_rh_id_seq OWNER TO interact;

--
-- Name: report_home_rh_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: interact
--

ALTER SEQUENCE report_home_rh_id_seq OWNED BY report_home.rh_id;


--
-- Name: rh_id; Type: DEFAULT; Schema: public; Owner: interact
--

ALTER TABLE ONLY report_home ALTER COLUMN rh_id SET DEFAULT nextval('report_home_rh_id_seq'::regclass);


--
-- Data for Name: report_home; Type: TABLE DATA; Schema: public; Owner: interact
--

INSERT INTO report_home VALUES (1, 91, '2015-03-23 00:00:00+00', '{"total_count":"28","unique_calls":"0","duration_sum":"2110","sales_inquiry_count":"0","sales_inquiry_sum":null,"conversion_count":"0","answered_count":"28","conversion_sum":null,"lead_count":"0","lead_sum":"75","org_unit_id":91,"org_unit_name":"Scott test","date":"2015-03-23T00:00:00.000Z"}');
INSERT INTO report_home VALUES (2, 85, '2015-04-21 00:00:00+00', '{"total_count":"8","unique_calls":"1","duration_sum":"80","sales_inquiry_count":"0","sales_inquiry_sum":null,"conversion_count":"0","answered_count":"8","conversion_sum":null,"lead_count":"0","lead_sum":null,"org_unit_id":85,"org_unit_name":"Blingy III brother","date":"2015-04-21T00:00:00.000Z"}');
INSERT INTO report_home VALUES (3, 91, '2015-03-21 00:00:00+00', '{"total_count":"17","unique_calls":"2","duration_sum":"170","sales_inquiry_count":"0","sales_inquiry_sum":null,"conversion_count":"0","answered_count":"17","conversion_sum":null,"lead_count":"0","lead_sum":null,"org_unit_id":91,"org_unit_name":"Scott test","date":"2015-03-21T00:00:00.000Z"}');
INSERT INTO report_home VALUES (4, 85, '2015-03-23 00:00:00+00', '{"total_count":"6","unique_calls":"0","duration_sum":"483","sales_inquiry_count":"0","sales_inquiry_sum":null,"conversion_count":"0","answered_count":"6","conversion_sum":null,"lead_count":"0","lead_sum":null,"org_unit_id":85,"org_unit_name":"Blingy III brother","date":"2015-03-23T00:00:00.000Z"}');
INSERT INTO report_home VALUES (5, 8, '2015-04-09 00:00:00+00', '{"total_count":"13","unique_calls":"1","duration_sum":"65","sales_inquiry_count":"0","sales_inquiry_sum":null,"conversion_count":"0","answered_count":"13","conversion_sum":null,"lead_count":"0","lead_sum":null,"org_unit_id":8,"org_unit_name":"Blingy Marketing LLC","date":"2015-04-09T00:00:00.000Z"}');
INSERT INTO report_home VALUES (6, 8, '2015-04-13 00:00:00+00', '{"total_count":"3","unique_calls":"1","duration_sum":"15","sales_inquiry_count":"0","sales_inquiry_sum":null,"conversion_count":"0","answered_count":"3","conversion_sum":null,"lead_count":"0","lead_sum":null,"org_unit_id":8,"org_unit_name":"Blingy Marketing LLC","date":"2015-04-13T00:00:00.000Z"}');
INSERT INTO report_home VALUES (7, 85, '2015-04-30 00:00:00+00', '{"total_count":"6","unique_calls":"1","duration_sum":"60","sales_inquiry_count":"0","sales_inquiry_sum":null,"conversion_count":"0","answered_count":"6","conversion_sum":null,"lead_count":"0","lead_sum":null,"org_unit_id":85,"org_unit_name":"Blingy III brother","date":"2015-04-30T00:00:00.000Z"}');
INSERT INTO report_home VALUES (8, 8, '2015-03-21 00:00:00+00', '{"total_count":"15","unique_calls":"15","duration_sum":"150","sales_inquiry_count":"0","sales_inquiry_sum":null,"conversion_count":"0","answered_count":"15","conversion_sum":null,"lead_count":"0","lead_sum":null,"org_unit_id":8,"org_unit_name":"Blingy Marketing LLC","date":"2015-03-21T00:00:00.000Z"}');
INSERT INTO report_home VALUES (9, 91, '2015-04-06 00:00:00+00', '{"total_count":"4","unique_calls":"1","duration_sum":"116","sales_inquiry_count":"0","sales_inquiry_sum":null,"conversion_count":"0","answered_count":"4","conversion_sum":null,"lead_count":"0","lead_sum":null,"org_unit_id":91,"org_unit_name":"Scott test","date":"2015-04-06T00:00:00.000Z"}');


--
-- Name: report_home_rh_id_seq; Type: SEQUENCE SET; Schema: public; Owner: interact
--

SELECT pg_catalog.setval('report_home_rh_id_seq', 9, true);


--
-- Name: report_home_pkey; Type: CONSTRAINT; Schema: public; Owner: interact; Tablespace: 
--

ALTER TABLE ONLY report_home
    ADD CONSTRAINT report_home_pkey PRIMARY KEY (rh_id);


--
-- Name: report_home_org_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: interact
--

ALTER TABLE ONLY report_home
    ADD CONSTRAINT report_home_org_unit_id_fkey FOREIGN KEY (org_unit_id) REFERENCES org_unit(org_unit_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

