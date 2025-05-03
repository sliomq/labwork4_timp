--
-- PostgreSQL database dump
--

-- Dumped from database version 16.3 (Debian 16.3-1+b1)
-- Dumped by pg_dump version 17.0 (Debian 17.0-1+b2)

-- Started on 2025-05-03 17:50:52 +07

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
--SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 220 (class 1255 OID 25399)
-- Name: check_login(character varying, character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.check_login(login character varying, pswd character varying) RETURNS boolean
    LANGUAGE plpgsql
    AS $_$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM authentication a
        WHERE a.login = $1 AND a.pswd = $2
    );
END;
$_$;


ALTER FUNCTION public.check_login(login character varying, pswd character varying) OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 219 (class 1259 OID 25392)
-- Name: authentication; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.authentication (
    login character varying(60) NOT NULL,
    pswd character varying(256) NOT NULL
);


ALTER TABLE public.authentication OWNER TO postgres;

--
-- TOC entry 216 (class 1259 OID 25375)
-- Name: extinguisher; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.extinguisher (
    extinguisher_id integer NOT NULL,
    name character varying(50) NOT NULL,
    volume integer NOT NULL
);


ALTER TABLE public.extinguisher OWNER TO postgres;

--
-- TOC entry 215 (class 1259 OID 25374)
-- Name: extinguisher_extinguisher_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.extinguisher_extinguisher_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.extinguisher_extinguisher_id_seq OWNER TO postgres;

--
-- TOC entry 3374 (class 0 OID 0)
-- Dependencies: 215
-- Name: extinguisher_extinguisher_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.extinguisher_extinguisher_id_seq OWNED BY public.extinguisher.extinguisher_id;


--
-- TOC entry 218 (class 1259 OID 25384)
-- Name: sensors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sensors (
    sensor_id integer NOT NULL,
    name character varying(50) NOT NULL,
    radius integer NOT NULL
);


ALTER TABLE public.sensors OWNER TO postgres;

--
-- TOC entry 217 (class 1259 OID 25383)
-- Name: sensors_sensor_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.sensors_sensor_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.sensors_sensor_id_seq OWNER TO postgres;

--
-- TOC entry 3375 (class 0 OID 0)
-- Dependencies: 217
-- Name: sensors_sensor_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.sensors_sensor_id_seq OWNED BY public.sensors.sensor_id;


--
-- TOC entry 3213 (class 2604 OID 25378)
-- Name: extinguisher extinguisher_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.extinguisher ALTER COLUMN extinguisher_id SET DEFAULT nextval('public.extinguisher_extinguisher_id_seq'::regclass);


--
-- TOC entry 3214 (class 2604 OID 25387)
-- Name: sensors sensor_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sensors ALTER COLUMN sensor_id SET DEFAULT nextval('public.sensors_sensor_id_seq'::regclass);


--
-- TOC entry 3368 (class 0 OID 25392)
-- Dependencies: 219
-- Data for Name: authentication; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.authentication (login, pswd) FROM stdin;
123	a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3
\.


--
-- TOC entry 3365 (class 0 OID 25375)
-- Dependencies: 216
-- Data for Name: extinguisher; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.extinguisher (extinguisher_id, name, volume) FROM stdin;
\.


--
-- TOC entry 3367 (class 0 OID 25384)
-- Dependencies: 218
-- Data for Name: sensors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sensors (sensor_id, name, radius) FROM stdin;
\.


--
-- TOC entry 3376 (class 0 OID 0)
-- Dependencies: 215
-- Name: extinguisher_extinguisher_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.extinguisher_extinguisher_id_seq', 30, true);


--
-- TOC entry 3377 (class 0 OID 0)
-- Dependencies: 217
-- Name: sensors_sensor_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.sensors_sensor_id_seq', 20, true);


--
-- TOC entry 3220 (class 2606 OID 25407)
-- Name: authentication authentication_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.authentication
    ADD CONSTRAINT authentication_pkey PRIMARY KEY (login);


--
-- TOC entry 3216 (class 2606 OID 25382)
-- Name: extinguisher extinguisher_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.extinguisher
    ADD CONSTRAINT extinguisher_pkey PRIMARY KEY (extinguisher_id);


--
-- TOC entry 3218 (class 2606 OID 25391)
-- Name: sensors sensors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sensors
    ADD CONSTRAINT sensors_pkey PRIMARY KEY (sensor_id);


-- Completed on 2025-05-03 17:50:54 +07

--
-- PostgreSQL database dump complete
--

