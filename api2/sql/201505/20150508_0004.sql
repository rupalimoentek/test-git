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
-- Name: report_group; Type: TABLE; Schema: public; Owner: interact; Tablespace: 
--

CREATE TABLE report_group (
    rg_id bigint NOT NULL,
    org_unit_id integer,
    rg_date timestamp with time zone,
    rg_grouping_key character varying(255),
    rg_grouping_value character varying(255),
    rg_json json
);


ALTER TABLE public.report_group OWNER TO interact;

--
-- Name: report_group_rg_id_seq; Type: SEQUENCE; Schema: public; Owner: interact
--

CREATE SEQUENCE report_group_rg_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.report_group_rg_id_seq OWNER TO interact;

--
-- Name: report_group_rg_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: interact
--

ALTER SEQUENCE report_group_rg_id_seq OWNED BY report_group.rg_id;


--
-- Name: rg_id; Type: DEFAULT; Schema: public; Owner: interact
--

ALTER TABLE ONLY report_group ALTER COLUMN rg_id SET DEFAULT nextval('report_group_rg_id_seq'::regclass);


--
-- Data for Name: report_group; Type: TABLE DATA; Schema: public; Owner: interact
--

INSERT INTO report_group VALUES (112, 85, '2015-04-30 14:00:00+00', 'call_flow', '677', '{"total_count":"3","unique_calls":"1","duration_sum":"30","sales_inquiry_count":"0","sales_inquiry_sum":null,"conversion_count":"0","answered_count":"3","conversion_sum":null,"lead_count":"0","lead_sum":null,"org_unit_id":85,"org_unit_name":"Blingy III brother","date":"2015-04-30T14:00:00.000Z","call_flow":677}');
INSERT INTO report_group VALUES (113, 8, '2015-03-21 04:00:00+00', 'campaign', '400', '{"total_count":"15","unique_calls":"15","duration_sum":"150","sales_inquiry_count":"0","sales_inquiry_sum":null,"conversion_count":"0","answered_count":"15","conversion_sum":null,"lead_count":"0","lead_sum":null,"org_unit_id":8,"org_unit_name":"Blingy Marketing LLC","date":"2015-03-21T04:00:00.000Z","campaign":400}');
INSERT INTO report_group VALUES (114, 8, '2015-03-21 04:00:00+00', 'call_flow', '677', '{"total_count":"15","unique_calls":"15","duration_sum":"150","sales_inquiry_count":"0","sales_inquiry_sum":null,"conversion_count":"0","answered_count":"15","conversion_sum":null,"lead_count":"0","lead_sum":null,"org_unit_id":8,"org_unit_name":"Blingy Marketing LLC","date":"2015-03-21T04:00:00.000Z","call_flow":677}');
INSERT INTO report_group VALUES (115, 91, '2015-03-21 16:00:00+00', 'campaign', '400', '{"total_count":"12","unique_calls":"2","duration_sum":"120","sales_inquiry_count":"0","sales_inquiry_sum":null,"conversion_count":"0","answered_count":"12","conversion_sum":null,"lead_count":"0","lead_sum":null,"org_unit_id":91,"org_unit_name":"Scott test","date":"2015-03-21T16:00:00.000Z","campaign":400}');
INSERT INTO report_group VALUES (116, 85, '2015-04-21 14:00:00+00', 'call_flow', '677', '{"total_count":"4","unique_calls":"1","duration_sum":"40","sales_inquiry_count":"0","sales_inquiry_sum":null,"conversion_count":"0","answered_count":"4","conversion_sum":null,"lead_count":"0","lead_sum":null,"org_unit_id":85,"org_unit_name":"Blingy III brother","date":"2015-04-21T14:00:00.000Z","call_flow":677}');
INSERT INTO report_group VALUES (117, 91, '2015-03-23 15:00:00+00', 'campaign', '400', '{"total_count":"7","unique_calls":"0","duration_sum":"802","sales_inquiry_count":"0","sales_inquiry_sum":null,"conversion_count":"0","answered_count":"7","conversion_sum":null,"lead_count":"0","lead_sum":null,"org_unit_id":91,"org_unit_name":"Scott test","date":"2015-03-23T15:00:00.000Z","campaign":400}');
INSERT INTO report_group VALUES (118, 8, '2015-04-13 20:00:00+00', 'call_flow', '1056', '{"total_count":"1","unique_calls":"1","duration_sum":"5","sales_inquiry_count":"0","sales_inquiry_sum":null,"conversion_count":"0","answered_count":"1","conversion_sum":null,"lead_count":"0","lead_sum":null,"org_unit_id":8,"org_unit_name":"Blingy Marketing LLC","date":"2015-04-13T20:00:00.000Z","call_flow":1056}');
INSERT INTO report_group VALUES (120, 91, '2015-03-23 17:00:00+00', 'call_flow', '677', '{"total_count":"1","unique_calls":"0","duration_sum":"132","sales_inquiry_count":"0","sales_inquiry_sum":null,"conversion_count":"0","answered_count":"1","conversion_sum":null,"lead_count":"0","lead_sum":null,"org_unit_id":91,"org_unit_name":"Scott test","date":"2015-03-23T17:00:00.000Z","call_flow":677}');
INSERT INTO report_group VALUES (122, 91, '2015-03-21 16:00:00+00', 'call_flow', '677', '{"total_count":"12","unique_calls":"2","duration_sum":"120","sales_inquiry_count":"0","sales_inquiry_sum":null,"conversion_count":"0","answered_count":"12","conversion_sum":null,"lead_count":"0","lead_sum":null,"org_unit_id":91,"org_unit_name":"Scott test","date":"2015-03-21T16:00:00.000Z","call_flow":677}');
INSERT INTO report_group VALUES (124, 91, '2015-03-23 15:00:00+00', 'call_flow', '677', '{"total_count":"7","unique_calls":"0","duration_sum":"802","sales_inquiry_count":"0","sales_inquiry_sum":null,"conversion_count":"0","answered_count":"7","conversion_sum":null,"lead_count":"0","lead_sum":null,"org_unit_id":91,"org_unit_name":"Scott test","date":"2015-03-23T15:00:00.000Z","call_flow":677}');
INSERT INTO report_group VALUES (126, 8, '2015-04-09 16:00:00+00', 'call_flow', '1056', '{"total_count":"2","unique_calls":"1","duration_sum":"10","sales_inquiry_count":"0","sales_inquiry_sum":null,"conversion_count":"0","answered_count":"2","conversion_sum":null,"lead_count":"0","lead_sum":null,"org_unit_id":8,"org_unit_name":"Blingy Marketing LLC","date":"2015-04-09T16:00:00.000Z","call_flow":1056}');
INSERT INTO report_group VALUES (128, 8, '2015-04-09 18:00:00+00', 'call_flow', '1056', '{"total_count":"6","unique_calls":"0","duration_sum":"30","sales_inquiry_count":"0","sales_inquiry_sum":null,"conversion_count":"0","answered_count":"6","conversion_sum":null,"lead_count":"0","lead_sum":null,"org_unit_id":8,"org_unit_name":"Blingy Marketing LLC","date":"2015-04-09T18:00:00.000Z","call_flow":1056}');
INSERT INTO report_group VALUES (130, 85, '2015-04-21 15:00:00+00', 'call_flow', '677', '{"total_count":"4","unique_calls":"0","duration_sum":"40","sales_inquiry_count":"0","sales_inquiry_sum":null,"conversion_count":"0","answered_count":"4","conversion_sum":null,"lead_count":"0","lead_sum":null,"org_unit_id":85,"org_unit_name":"Blingy III brother","date":"2015-04-21T15:00:00.000Z","call_flow":677}');
INSERT INTO report_group VALUES (132, 8, '2015-04-13 21:00:00+00', 'call_flow', '1056', '{"total_count":"2","unique_calls":"0","duration_sum":"10","sales_inquiry_count":"0","sales_inquiry_sum":null,"conversion_count":"0","answered_count":"2","conversion_sum":null,"lead_count":"0","lead_sum":null,"org_unit_id":8,"org_unit_name":"Blingy Marketing LLC","date":"2015-04-13T21:00:00.000Z","call_flow":1056}');
INSERT INTO report_group VALUES (134, 91, '2015-03-23 14:00:00+00', 'call_flow', '677', '{"total_count":"12","unique_calls":"0","duration_sum":"120","sales_inquiry_count":"0","sales_inquiry_sum":null,"conversion_count":"0","answered_count":"12","conversion_sum":null,"lead_count":"0","lead_sum":"75","org_unit_id":91,"org_unit_name":"Scott test","date":"2015-03-23T14:00:00.000Z","call_flow":677}');
INSERT INTO report_group VALUES (136, 91, '2015-03-21 15:00:00+00', 'call_flow', '677', '{"total_count":"5","unique_calls":"0","duration_sum":"50","sales_inquiry_count":"0","sales_inquiry_sum":null,"conversion_count":"0","answered_count":"5","conversion_sum":null,"lead_count":"0","lead_sum":null,"org_unit_id":91,"org_unit_name":"Scott test","date":"2015-03-21T15:00:00.000Z","call_flow":677}');
INSERT INTO report_group VALUES (138, 8, '2015-04-09 17:00:00+00', 'call_flow', '1056', '{"total_count":"5","unique_calls":"0","duration_sum":"25","sales_inquiry_count":"0","sales_inquiry_sum":null,"conversion_count":"0","answered_count":"5","conversion_sum":null,"lead_count":"0","lead_sum":null,"org_unit_id":8,"org_unit_name":"Blingy Marketing LLC","date":"2015-04-09T17:00:00.000Z","call_flow":1056}');
INSERT INTO report_group VALUES (140, 85, '2015-03-23 17:00:00+00', 'call_flow', '677', '{"total_count":"6","unique_calls":"0","duration_sum":"483","sales_inquiry_count":"0","sales_inquiry_sum":null,"conversion_count":"0","answered_count":"6","conversion_sum":null,"lead_count":"0","lead_sum":null,"org_unit_id":85,"org_unit_name":"Blingy III brother","date":"2015-03-23T17:00:00.000Z","call_flow":677}');
INSERT INTO report_group VALUES (142, 91, '2015-03-23 16:00:00+00', 'call_flow', '677', '{"total_count":"8","unique_calls":"0","duration_sum":"1056","sales_inquiry_count":"0","sales_inquiry_sum":null,"conversion_count":"0","answered_count":"8","conversion_sum":null,"lead_count":"0","lead_sum":null,"org_unit_id":91,"org_unit_name":"Scott test","date":"2015-03-23T16:00:00.000Z","call_flow":677}');
INSERT INTO report_group VALUES (144, 85, '2015-04-30 15:00:00+00', 'call_flow', '677', '{"total_count":"3","unique_calls":"0","duration_sum":"30","sales_inquiry_count":"0","sales_inquiry_sum":null,"conversion_count":"0","answered_count":"3","conversion_sum":null,"lead_count":"0","lead_sum":null,"org_unit_id":85,"org_unit_name":"Blingy III brother","date":"2015-04-30T15:00:00.000Z","call_flow":677}');
INSERT INTO report_group VALUES (146, 91, '2015-04-06 16:00:00+00', 'call_flow', '684', '{"total_count":"4","unique_calls":"1","duration_sum":"116","sales_inquiry_count":"0","sales_inquiry_sum":null,"conversion_count":"0","answered_count":"4","conversion_sum":null,"lead_count":"0","lead_sum":null,"org_unit_id":91,"org_unit_name":"Scott test","date":"2015-04-06T16:00:00.000Z","call_flow":684}');
INSERT INTO report_group VALUES (119, 91, '2015-04-06 16:00:00+00', 'campaign', '403', '{"total_count":"4","unique_calls":"1","duration_sum":"116","sales_inquiry_count":"0","sales_inquiry_sum":null,"conversion_count":"0","answered_count":"4","conversion_sum":null,"lead_count":"0","lead_sum":null,"org_unit_id":91,"org_unit_name":"Scott test","date":"2015-04-06T16:00:00.000Z","campaign":403}');
INSERT INTO report_group VALUES (121, 91, '2015-03-23 14:00:00+00', 'campaign', '400', '{"total_count":"12","unique_calls":"0","duration_sum":"120","sales_inquiry_count":"0","sales_inquiry_sum":null,"conversion_count":"0","answered_count":"12","conversion_sum":null,"lead_count":"0","lead_sum":"75","org_unit_id":91,"org_unit_name":"Scott test","date":"2015-03-23T14:00:00.000Z","campaign":400}');
INSERT INTO report_group VALUES (123, 8, '2015-04-13 21:00:00+00', 'campaign', '407', '{"total_count":"2","unique_calls":"0","duration_sum":"10","sales_inquiry_count":"0","sales_inquiry_sum":null,"conversion_count":"0","answered_count":"2","conversion_sum":null,"lead_count":"0","lead_sum":null,"org_unit_id":8,"org_unit_name":"Blingy Marketing LLC","date":"2015-04-13T21:00:00.000Z","campaign":407}');
INSERT INTO report_group VALUES (125, 85, '2015-04-21 15:00:00+00', 'campaign', '400', '{"total_count":"4","unique_calls":"0","duration_sum":"40","sales_inquiry_count":"0","sales_inquiry_sum":null,"conversion_count":"0","answered_count":"4","conversion_sum":null,"lead_count":"0","lead_sum":null,"org_unit_id":85,"org_unit_name":"Blingy III brother","date":"2015-04-21T15:00:00.000Z","campaign":400}');
INSERT INTO report_group VALUES (127, 8, '2015-04-09 16:00:00+00', 'campaign', '407', '{"total_count":"2","unique_calls":"1","duration_sum":"10","sales_inquiry_count":"0","sales_inquiry_sum":null,"conversion_count":"0","answered_count":"2","conversion_sum":null,"lead_count":"0","lead_sum":null,"org_unit_id":8,"org_unit_name":"Blingy Marketing LLC","date":"2015-04-09T16:00:00.000Z","campaign":407}');
INSERT INTO report_group VALUES (129, 8, '2015-04-09 18:00:00+00', 'campaign', '407', '{"total_count":"6","unique_calls":"0","duration_sum":"30","sales_inquiry_count":"0","sales_inquiry_sum":null,"conversion_count":"0","answered_count":"6","conversion_sum":null,"lead_count":"0","lead_sum":null,"org_unit_id":8,"org_unit_name":"Blingy Marketing LLC","date":"2015-04-09T18:00:00.000Z","campaign":407}');
INSERT INTO report_group VALUES (131, 91, '2015-03-23 16:00:00+00', 'campaign', '400', '{"total_count":"8","unique_calls":"0","duration_sum":"1056","sales_inquiry_count":"0","sales_inquiry_sum":null,"conversion_count":"0","answered_count":"8","conversion_sum":null,"lead_count":"0","lead_sum":null,"org_unit_id":91,"org_unit_name":"Scott test","date":"2015-03-23T16:00:00.000Z","campaign":400}');
INSERT INTO report_group VALUES (133, 85, '2015-04-30 15:00:00+00', 'campaign', '400', '{"total_count":"3","unique_calls":"0","duration_sum":"30","sales_inquiry_count":"0","sales_inquiry_sum":null,"conversion_count":"0","answered_count":"3","conversion_sum":null,"lead_count":"0","lead_sum":null,"org_unit_id":85,"org_unit_name":"Blingy III brother","date":"2015-04-30T15:00:00.000Z","campaign":400}');
INSERT INTO report_group VALUES (135, 91, '2015-03-21 15:00:00+00', 'campaign', '400', '{"total_count":"5","unique_calls":"0","duration_sum":"50","sales_inquiry_count":"0","sales_inquiry_sum":null,"conversion_count":"0","answered_count":"5","conversion_sum":null,"lead_count":"0","lead_sum":null,"org_unit_id":91,"org_unit_name":"Scott test","date":"2015-03-21T15:00:00.000Z","campaign":400}');
INSERT INTO report_group VALUES (137, 85, '2015-03-23 17:00:00+00', 'campaign', '400', '{"total_count":"6","unique_calls":"0","duration_sum":"483","sales_inquiry_count":"0","sales_inquiry_sum":null,"conversion_count":"0","answered_count":"6","conversion_sum":null,"lead_count":"0","lead_sum":null,"org_unit_id":85,"org_unit_name":"Blingy III brother","date":"2015-03-23T17:00:00.000Z","campaign":400}');
INSERT INTO report_group VALUES (139, 8, '2015-04-09 17:00:00+00', 'campaign', '407', '{"total_count":"5","unique_calls":"0","duration_sum":"25","sales_inquiry_count":"0","sales_inquiry_sum":null,"conversion_count":"0","answered_count":"5","conversion_sum":null,"lead_count":"0","lead_sum":null,"org_unit_id":8,"org_unit_name":"Blingy Marketing LLC","date":"2015-04-09T17:00:00.000Z","campaign":407}');
INSERT INTO report_group VALUES (141, 85, '2015-04-21 14:00:00+00', 'campaign', '400', '{"total_count":"4","unique_calls":"1","duration_sum":"40","sales_inquiry_count":"0","sales_inquiry_sum":null,"conversion_count":"0","answered_count":"4","conversion_sum":null,"lead_count":"0","lead_sum":null,"org_unit_id":85,"org_unit_name":"Blingy III brother","date":"2015-04-21T14:00:00.000Z","campaign":400}');
INSERT INTO report_group VALUES (143, 91, '2015-03-23 17:00:00+00', 'campaign', '400', '{"total_count":"1","unique_calls":"0","duration_sum":"132","sales_inquiry_count":"0","sales_inquiry_sum":null,"conversion_count":"0","answered_count":"1","conversion_sum":null,"lead_count":"0","lead_sum":null,"org_unit_id":91,"org_unit_name":"Scott test","date":"2015-03-23T17:00:00.000Z","campaign":400}');
INSERT INTO report_group VALUES (145, 8, '2015-04-13 20:00:00+00', 'campaign', '407', '{"total_count":"1","unique_calls":"1","duration_sum":"5","sales_inquiry_count":"0","sales_inquiry_sum":null,"conversion_count":"0","answered_count":"1","conversion_sum":null,"lead_count":"0","lead_sum":null,"org_unit_id":8,"org_unit_name":"Blingy Marketing LLC","date":"2015-04-13T20:00:00.000Z","campaign":407}');
INSERT INTO report_group VALUES (147, 85, '2015-04-30 14:00:00+00', 'campaign', '400', '{"total_count":"3","unique_calls":"1","duration_sum":"30","sales_inquiry_count":"0","sales_inquiry_sum":null,"conversion_count":"0","answered_count":"3","conversion_sum":null,"lead_count":"0","lead_sum":null,"org_unit_id":85,"org_unit_name":"Blingy III brother","date":"2015-04-30T14:00:00.000Z","campaign":400}');


--
-- Name: report_group_rg_id_seq; Type: SEQUENCE SET; Schema: public; Owner: interact
--

SELECT pg_catalog.setval('report_group_rg_id_seq', 147, true);


--
-- Name: report_group_pkey; Type: CONSTRAINT; Schema: public; Owner: interact; Tablespace: 
--

ALTER TABLE ONLY report_group
    ADD CONSTRAINT report_group_pkey PRIMARY KEY (rg_id);


--
-- Name: report_group_org_unit_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: interact
--

ALTER TABLE ONLY report_group
    ADD CONSTRAINT report_group_org_unit_id_fkey FOREIGN KEY (org_unit_id) REFERENCES org_unit(org_unit_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

