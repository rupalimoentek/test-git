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
-- Name: report_dni_log_temp; Type: TABLE; Schema: public; Owner: interact; Tablespace: 
--

CREATE TABLE report_dni_log_temp (
    rdlt_id bigint NOT NULL,
    call_id integer,
    keyword character varying(500),
    first_page character varying(500),
    last_page character varying(500)
);


ALTER TABLE public.report_dni_log_temp OWNER TO interact;

--
-- Name: report_dni_log_temp_rdlt_id_seq; Type: SEQUENCE; Schema: public; Owner: interact
--

CREATE SEQUENCE report_dni_log_temp_rdlt_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.report_dni_log_temp_rdlt_id_seq OWNER TO interact;

--
-- Name: report_dni_log_temp_rdlt_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: interact
--

ALTER SEQUENCE report_dni_log_temp_rdlt_id_seq OWNED BY report_dni_log_temp.rdlt_id;


--
-- Name: rdlt_id; Type: DEFAULT; Schema: public; Owner: interact
--

ALTER TABLE ONLY report_dni_log_temp ALTER COLUMN rdlt_id SET DEFAULT nextval('report_dni_log_temp_rdlt_id_seq'::regclass);


--
-- Data for Name: report_dni_log_temp; Type: TABLE DATA; Schema: public; Owner: interact
--



--
-- Name: report_dni_log_temp_rdlt_id_seq; Type: SEQUENCE SET; Schema: public; Owner: interact
--

SELECT pg_catalog.setval('report_dni_log_temp_rdlt_id_seq', 1, false);


--
-- Name: report_dni_log_temp_pkey; Type: CONSTRAINT; Schema: public; Owner: interact; Tablespace: 
--

ALTER TABLE ONLY report_dni_log_temp
    ADD CONSTRAINT report_dni_log_temp_pkey PRIMARY KEY (rdlt_id);


--
-- PostgreSQL database dump complete
--

