--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9
-- Dumped by pg_dump version 16.9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: AgeCategory; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AgeCategory" AS ENUM (
    'PUPPY',
    'YOUNG_ADULT',
    'ADULT',
    'SENIOR'
);


ALTER TYPE public."AgeCategory" OWNER TO postgres;

--
-- Name: ContactStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ContactStatus" AS ENUM (
    'UNREAD',
    'READ',
    'REPLIED'
);


ALTER TYPE public."ContactStatus" OWNER TO postgres;

--
-- Name: DogApplicationStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."DogApplicationStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED',
    'WITHDRAWN'
);


ALTER TYPE public."DogApplicationStatus" OWNER TO postgres;

--
-- Name: DogStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."DogStatus" AS ENUM (
    'AVAILABLE',
    'PENDING',
    'REHOMED',
    'DELETED'
);


ALTER TYPE public."DogStatus" OWNER TO postgres;

--
-- Name: FinanceType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."FinanceType" AS ENUM (
    'INCOME',
    'EXPENSE'
);


ALTER TYPE public."FinanceType" OWNER TO postgres;

--
-- Name: Gender; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Gender" AS ENUM (
    'MALE',
    'FEMALE',
    'UNKNOWN'
);


ALTER TYPE public."Gender" OWNER TO postgres;

--
-- Name: InvoiceStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."InvoiceStatus" AS ENUM (
    'PENDING',
    'PAID',
    'REHOMED'
);


ALTER TYPE public."InvoiceStatus" OWNER TO postgres;

--
-- Name: Role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Role" AS ENUM (
    'ADMIN',
    'STAFF',
    'BUYER'
);


ALTER TYPE public."Role" OWNER TO postgres;

--
-- Name: ScreeningStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ScreeningStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED'
);


ALTER TYPE public."ScreeningStatus" OWNER TO postgres;

--
-- Name: Size; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Size" AS ENUM (
    'SMALL',
    'MEDIUM',
    'LARGE',
    'UNKNOWN'
);


ALTER TYPE public."Size" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: BackgroundScreening; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."BackgroundScreening" (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    experience text NOT NULL,
    "livingConditions" text NOT NULL,
    household text NOT NULL,
    "timeCommitment" text NOT NULL,
    "idDocument" text NOT NULL,
    "proofOfResidence" text NOT NULL,
    letter text,
    "interestedBreed" text,
    status public."ScreeningStatus" DEFAULT 'PENDING'::public."ScreeningStatus" NOT NULL,
    "adminNote" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    archived boolean DEFAULT false NOT NULL
);


ALTER TABLE public."BackgroundScreening" OWNER TO postgres;

--
-- Name: BackgroundScreening_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."BackgroundScreening_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."BackgroundScreening_id_seq" OWNER TO postgres;

--
-- Name: BackgroundScreening_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."BackgroundScreening_id_seq" OWNED BY public."BackgroundScreening".id;


--
-- Name: ContactMessage; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ContactMessage" (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    subject text NOT NULL,
    message text NOT NULL,
    "dogName" text,
    status public."ContactStatus" DEFAULT 'UNREAD'::public."ContactStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ContactMessage" OWNER TO postgres;

--
-- Name: ContactMessage_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."ContactMessage_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."ContactMessage_id_seq" OWNER TO postgres;

--
-- Name: ContactMessage_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."ContactMessage_id_seq" OWNED BY public."ContactMessage".id;


--
-- Name: Conversation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Conversation" (
    id integer NOT NULL,
    "buyerId" integer NOT NULL,
    "archivedByBuyer" boolean DEFAULT false NOT NULL,
    "archivedByAdmin" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Conversation" OWNER TO postgres;

--
-- Name: Conversation_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Conversation_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Conversation_id_seq" OWNER TO postgres;

--
-- Name: Conversation_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Conversation_id_seq" OWNED BY public."Conversation".id;


--
-- Name: Dog; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Dog" (
    id integer NOT NULL,
    name text NOT NULL,
    breed text NOT NULL,
    type text NOT NULL,
    "birthDate" timestamp(3) without time zone,
    temperament text NOT NULL,
    "healthStatus" text NOT NULL,
    images text[],
    price double precision NOT NULL,
    "costFood" double precision NOT NULL,
    "costVitamins" double precision NOT NULL,
    "costVet" double precision NOT NULL,
    "costVaccine" double precision NOT NULL,
    "costGrooming" double precision NOT NULL,
    "costAccessories" double precision NOT NULL,
    status public."DogStatus" DEFAULT 'AVAILABLE'::public."DogStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "ageCategory" public."AgeCategory" DEFAULT 'PUPPY'::public."AgeCategory" NOT NULL,
    age integer,
    gender public."Gender" DEFAULT 'UNKNOWN'::public."Gender" NOT NULL,
    size public."Size" DEFAULT 'UNKNOWN'::public."Size" NOT NULL
);


ALTER TABLE public."Dog" OWNER TO postgres;

--
-- Name: DogApplication; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."DogApplication" (
    id integer NOT NULL,
    "buyerId" integer NOT NULL,
    "dogId" integer NOT NULL,
    message text NOT NULL,
    status public."DogApplicationStatus" DEFAULT 'PENDING'::public."DogApplicationStatus" NOT NULL,
    "adminNote" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "withdrawNote" text
);


ALTER TABLE public."DogApplication" OWNER TO postgres;

--
-- Name: DogApplication_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."DogApplication_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."DogApplication_id_seq" OWNER TO postgres;

--
-- Name: DogApplication_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."DogApplication_id_seq" OWNED BY public."DogApplication".id;


--
-- Name: DogDocument; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."DogDocument" (
    id integer NOT NULL,
    "dogId" integer NOT NULL,
    "fileName" text NOT NULL,
    "filePath" text NOT NULL,
    "fileType" text NOT NULL,
    "uploadedById" integer NOT NULL,
    description text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."DogDocument" OWNER TO postgres;

--
-- Name: DogDocument_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."DogDocument_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."DogDocument_id_seq" OWNER TO postgres;

--
-- Name: DogDocument_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."DogDocument_id_seq" OWNED BY public."DogDocument".id;


--
-- Name: Dog_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Dog_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Dog_id_seq" OWNER TO postgres;

--
-- Name: Dog_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Dog_id_seq" OWNED BY public."Dog".id;


--
-- Name: FavoriteDog; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."FavoriteDog" (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    "dogId" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."FavoriteDog" OWNER TO postgres;

--
-- Name: FavoriteDog_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."FavoriteDog_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."FavoriteDog_id_seq" OWNER TO postgres;

--
-- Name: FavoriteDog_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."FavoriteDog_id_seq" OWNED BY public."FavoriteDog".id;


--
-- Name: FinanceEntry; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."FinanceEntry" (
    id integer NOT NULL,
    type public."FinanceType" NOT NULL,
    category text NOT NULL,
    amount double precision NOT NULL,
    description text,
    date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdById" integer NOT NULL
);


ALTER TABLE public."FinanceEntry" OWNER TO postgres;

--
-- Name: FinanceEntry_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."FinanceEntry_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."FinanceEntry_id_seq" OWNER TO postgres;

--
-- Name: FinanceEntry_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."FinanceEntry_id_seq" OWNED BY public."FinanceEntry".id;


--
-- Name: Invoice; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Invoice" (
    id integer NOT NULL,
    "applicationId" integer NOT NULL,
    amount double precision NOT NULL,
    breakdown jsonb NOT NULL,
    status public."InvoiceStatus" DEFAULT 'PENDING'::public."InvoiceStatus" NOT NULL,
    "paidAt" timestamp(3) without time zone,
    "rehomedAt" timestamp(3) without time zone,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Invoice" OWNER TO postgres;

--
-- Name: InvoiceAuditLog; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."InvoiceAuditLog" (
    id integer NOT NULL,
    "invoiceId" integer NOT NULL,
    "userId" integer NOT NULL,
    action text NOT NULL,
    changes jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."InvoiceAuditLog" OWNER TO postgres;

--
-- Name: InvoiceAuditLog_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."InvoiceAuditLog_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."InvoiceAuditLog_id_seq" OWNER TO postgres;

--
-- Name: InvoiceAuditLog_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."InvoiceAuditLog_id_seq" OWNED BY public."InvoiceAuditLog".id;


--
-- Name: Invoice_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Invoice_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Invoice_id_seq" OWNER TO postgres;

--
-- Name: Invoice_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Invoice_id_seq" OWNED BY public."Invoice".id;


--
-- Name: Message; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Message" (
    id integer NOT NULL,
    "conversationId" integer NOT NULL,
    "senderId" integer NOT NULL,
    content text NOT NULL,
    "isRead" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Message" OWNER TO postgres;

--
-- Name: MessageAttachment; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."MessageAttachment" (
    id integer NOT NULL,
    "messageId" integer NOT NULL,
    "fileName" text NOT NULL,
    "filePath" text NOT NULL,
    "fileType" text NOT NULL,
    "fileSize" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."MessageAttachment" OWNER TO postgres;

--
-- Name: MessageAttachment_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."MessageAttachment_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."MessageAttachment_id_seq" OWNER TO postgres;

--
-- Name: MessageAttachment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."MessageAttachment_id_seq" OWNED BY public."MessageAttachment".id;


--
-- Name: Message_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Message_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Message_id_seq" OWNER TO postgres;

--
-- Name: Message_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Message_id_seq" OWNED BY public."Message".id;


--
-- Name: OTP; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."OTP" (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    code text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    used boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."OTP" OWNER TO postgres;

--
-- Name: OTP_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."OTP_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."OTP_id_seq" OWNER TO postgres;

--
-- Name: OTP_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."OTP_id_seq" OWNED BY public."OTP".id;


--
-- Name: Session; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Session" (
    id integer NOT NULL,
    "userId" integer NOT NULL,
    token text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Session" OWNER TO postgres;

--
-- Name: Session_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Session_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Session_id_seq" OWNER TO postgres;

--
-- Name: Session_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Session_id_seq" OWNED BY public."Session".id;


--
-- Name: Transaction; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Transaction" (
    id integer NOT NULL,
    "buyerId" integer NOT NULL,
    "dogId" integer NOT NULL,
    "processedById" integer NOT NULL,
    date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    price double precision NOT NULL,
    "totalCost" double precision NOT NULL,
    profit double precision NOT NULL,
    receipt text NOT NULL,
    status public."DogStatus" NOT NULL
);


ALTER TABLE public."Transaction" OWNER TO postgres;

--
-- Name: Transaction_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."Transaction_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."Transaction_id_seq" OWNER TO postgres;

--
-- Name: Transaction_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."Transaction_id_seq" OWNED BY public."Transaction".id;


--
-- Name: User; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."User" (
    id integer NOT NULL,
    email text NOT NULL,
    password text NOT NULL,
    name text NOT NULL,
    role public."Role" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "isActive" boolean DEFAULT true NOT NULL
);


ALTER TABLE public."User" OWNER TO postgres;

--
-- Name: User_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."User_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."User_id_seq" OWNER TO postgres;

--
-- Name: User_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."User_id_seq" OWNED BY public."User".id;


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Name: BackgroundScreening id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BackgroundScreening" ALTER COLUMN id SET DEFAULT nextval('public."BackgroundScreening_id_seq"'::regclass);


--
-- Name: ContactMessage id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ContactMessage" ALTER COLUMN id SET DEFAULT nextval('public."ContactMessage_id_seq"'::regclass);


--
-- Name: Conversation id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Conversation" ALTER COLUMN id SET DEFAULT nextval('public."Conversation_id_seq"'::regclass);


--
-- Name: Dog id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Dog" ALTER COLUMN id SET DEFAULT nextval('public."Dog_id_seq"'::regclass);


--
-- Name: DogApplication id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DogApplication" ALTER COLUMN id SET DEFAULT nextval('public."DogApplication_id_seq"'::regclass);


--
-- Name: DogDocument id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DogDocument" ALTER COLUMN id SET DEFAULT nextval('public."DogDocument_id_seq"'::regclass);


--
-- Name: FavoriteDog id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."FavoriteDog" ALTER COLUMN id SET DEFAULT nextval('public."FavoriteDog_id_seq"'::regclass);


--
-- Name: FinanceEntry id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."FinanceEntry" ALTER COLUMN id SET DEFAULT nextval('public."FinanceEntry_id_seq"'::regclass);


--
-- Name: Invoice id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Invoice" ALTER COLUMN id SET DEFAULT nextval('public."Invoice_id_seq"'::regclass);


--
-- Name: InvoiceAuditLog id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."InvoiceAuditLog" ALTER COLUMN id SET DEFAULT nextval('public."InvoiceAuditLog_id_seq"'::regclass);


--
-- Name: Message id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Message" ALTER COLUMN id SET DEFAULT nextval('public."Message_id_seq"'::regclass);


--
-- Name: MessageAttachment id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MessageAttachment" ALTER COLUMN id SET DEFAULT nextval('public."MessageAttachment_id_seq"'::regclass);


--
-- Name: OTP id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OTP" ALTER COLUMN id SET DEFAULT nextval('public."OTP_id_seq"'::regclass);


--
-- Name: Session id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Session" ALTER COLUMN id SET DEFAULT nextval('public."Session_id_seq"'::regclass);


--
-- Name: Transaction id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Transaction" ALTER COLUMN id SET DEFAULT nextval('public."Transaction_id_seq"'::regclass);


--
-- Name: User id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User" ALTER COLUMN id SET DEFAULT nextval('public."User_id_seq"'::regclass);


--
-- Data for Name: BackgroundScreening; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."BackgroundScreening" (id, "userId", experience, "livingConditions", household, "timeCommitment", "idDocument", "proofOfResidence", letter, "interestedBreed", status, "adminNote", "createdAt", "updatedAt", archived) FROM stdin;
14	13	First-time pet owner	test	test	tset	uploads/documents/1751403572892-Adopt-Post-1024x1024.jpg	uploads/documents/1751403572893-262e3b65-7acf-4c94-96e8-c4c5de06b065(1).png	test	test	REJECTED	fsda	2025-07-01 20:59:32.894	2025-07-01 20:59:54.44	t
7	5	Some experience	test	test	test	uploads/documents/1751321195456-476630847_621732960367924_403233450667873811_n.jpg	uploads/documents/1751321195457-image-3.png	tets	test	APPROVED	\N	2025-06-30 22:06:35.459	2025-07-01 00:08:55.12	f
4	2	First-time pet owner	test	test	test	uploads/documents/1751318206352-476630847_621732960367924_403233450667873811_n.jpg	uploads/documents/1751318206353-image-3.png	test	test	REJECTED	\N	2025-06-30 21:16:46.355	2025-07-01 00:36:47.781	f
5	3	Some experience	test	test	test	uploads/documents/1751319222742-476630847_621732960367924_403233450667873811_n.jpg	uploads/documents/1751319222743-image-3.png	test	test	REJECTED	done	2025-06-30 21:33:42.744	2025-07-01 00:37:50.362	f
8	7	First-time pet owner	test	test	test	uploads/documents/1751333578665-476630847_621732960367924_403233450667873811_n.jpg	uploads/documents/1751333578666-image-3.png	test	test	APPROVED	\N	2025-07-01 01:32:58.668	2025-07-01 01:33:09.114	f
6	4	Some experience	test	test	test	uploads/documents/1751319406151-476630847_621732960367924_403233450667873811_n.jpg	uploads/documents/1751319406152-image-3.png	test	test	REJECTED	invalid id	2025-06-30 21:36:46.154	2025-07-01 17:42:39.804	f
17	15	First-time pet owner	fdsa	fdsa	sdfa	uploads/documents/1751404699203-Adopt-Post-1024x1024.jpg	uploads/documents/1751404699204-Adopt-Mateo-1024x1024.jpg	fdsa	fsda	APPROVED	\N	2025-07-01 21:18:19.205	2025-07-01 21:18:29.978	f
9	8	Some experience	winnie	test	test	uploads/documents/1751391734420-476630847_621732960367924_403233450667873811_n.jpg	uploads/documents/1751391734420-image-3.png	test	test	APPROVED	\N	2025-07-01 17:42:14.422	2025-07-01 17:42:52.964	f
18	16	Some experience	test	test	test	uploads/documents/1751411598160-Adopt-Post-1024x1024.jpg	uploads/documents/1751411598161-262e3b65-7acf-4c94-96e8-c4c5de06b065(1).png	tes	tes	PENDING	\N	2025-07-01 23:13:18.163	2025-07-01 23:13:18.163	f
10	9	Experienced dog owner	123	test	tset	uploads/documents/1751401548982-476630847_621732960367924_403233450667873811_n.jpg	uploads/documents/1751401548983-image-3.png	test	test	REJECTED	ayaw ko	2025-07-01 20:25:48.984	2025-07-01 20:26:32.417	t
19	17	First-time pet owner	Decent home, suitable for pets. Good community.	1 child 2 cats	4 hours a day	uploads/documents/1751415514470-476630847_621732960367924_403233450667873811_n.jpg	uploads/documents/1751415514471-image-3.png	I want my child to experience having a dog	Poodle	APPROVED	\N	2025-07-02 00:18:34.472	2025-07-02 00:19:11.109	f
11	10	First-time pet owner	test	test	test	uploads/documents/1751402555279-476630847_621732960367924_403233450667873811_n.jpg	uploads/documents/1751402555279-image-3.png	test	test	REJECTED	pass	2025-07-01 20:42:35.282	2025-07-01 20:43:04.584	t
12	11	First-time pet owner	resr	resr	resr	uploads/documents/1751403082964-img_1920x_68621f4dd09716-04173760-55456099.jpg	uploads/documents/1751403082966-Adopt-Post-1024x1024.jpg	resr	resr	PENDING	\N	2025-07-01 20:50:44.478	2025-07-01 20:51:22.967	t
13	12	Experienced dog owner	123	123	123	uploads/documents/1751403291622-img_1920x_68621f4dd09716-04173760-55456099.jpg	uploads/documents/1751403291623-Adopt-Post-1024x1024.jpg	123	123	REJECTED	nah	2025-07-01 20:54:51.625	2025-07-01 20:55:12.025	t
\.


--
-- Data for Name: ContactMessage; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ContactMessage" (id, "userId", subject, message, "dogName", status, "createdAt") FROM stdin;
1	5	Rehoming Request for Quila	I am interested in rehoming Quila (Maltese). Please contact me to discuss the process.	Quila	UNREAD	2025-07-01 00:53:12.229
2	5	Rehoming Request for Quila	I am interested in rehoming Quila (Maltese). Please contact me to discuss the process.	Quila	UNREAD	2025-07-01 00:54:49.861
3	5	Rehoming Request for Quila	I am interested in rehoming Quila (Maltese). Please contact me to discuss the process.	Quila	UNREAD	2025-07-01 00:55:01.868
4	5	Rehoming Request for Quila	I am interested in rehoming Quila (Maltese). Please contact me to discuss the process.	Quila	UNREAD	2025-07-01 00:58:35.076
5	5	Rehoming Request for Quila	I am interested in rehoming Quila (Maltese). Please contact me to discuss the process.	Quila	UNREAD	2025-07-01 00:58:39.803
6	5	Rehoming Request for Quila	I am interested in rehoming Quila (Maltese). Please contact me to discuss the process.	Quila	UNREAD	2025-07-01 00:58:48.231
7	5	Rehoming Request for Quila	I am interested in rehoming Quila (Maltese). Please contact me to discuss the process.	Quila	UNREAD	2025-07-01 00:59:53.97
8	5	Rehoming Request for Quila	I am interested in rehoming Quila (Maltese). Please contact me to discuss the process.	Quila	UNREAD	2025-07-01 01:00:42.928
9	5	Rehoming Request for Quila	I am interested in rehoming Quila (Maltese). Please contact me to discuss the process.	Quila	UNREAD	2025-07-01 01:01:44.017
\.


--
-- Data for Name: Conversation; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Conversation" (id, "buyerId", "archivedByBuyer", "archivedByAdmin", "createdAt", "updatedAt") FROM stdin;
1	5	f	f	2025-07-01 00:03:16.142	2025-07-01 00:03:16.142
2	7	f	f	2025-07-01 01:38:46.001	2025-07-01 03:58:53.628
4	9	f	f	2025-07-01 20:26:28.382	2025-07-01 20:26:28.382
5	15	f	f	2025-07-01 21:18:54.287	2025-07-01 21:19:21.085
3	8	f	f	2025-07-01 17:43:29.32	2025-07-01 22:19:30.015
6	17	f	f	2025-07-02 00:21:27.062	2025-07-02 00:21:47.792
\.


--
-- Data for Name: Dog; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Dog" (id, name, breed, type, "birthDate", temperament, "healthStatus", images, price, "costFood", "costVitamins", "costVet", "costVaccine", "costGrooming", "costAccessories", status, "createdAt", "updatedAt", "ageCategory", age, gender, size) FROM stdin;
3	Winnie	Dachshund	Purebred	2023-10-21 00:00:00	Active	Special Needs	{uploads/dogs/1751339165409-IMG_3007.jpg}	5000	2000	2000	2000	2000	2000	2000	DELETED	2025-07-01 03:06:05.412	2025-07-01 03:06:52.936	PUPPY	\N	FEMALE	SMALL
1	Champion	Rottweiler	Purebred	2024-10-09 00:00:00	Friendly	Vaccinated	{uploads/dogs/1751303712442-480654520_934777028855750_2760683209119604210_n.jpg}	10000	1000	1000	2000	2500	800	500	PENDING	2025-06-30 17:15:12.444	2025-07-01 03:24:57.58	PUPPY	\N	UNKNOWN	UNKNOWN
4	Winnie	Dachshund	Purebred	2023-08-09 00:00:00	Active	Healthy	{"uploads/dogs/1751339248320-Screenshot 2025-07-01 110643.png",uploads/dogs/1751339248321-IMG_3007.jpg}	5000	2000	2000	2000	2000	2000	2000	PENDING	2025-07-01 03:07:28.324	2025-07-01 17:43:28.497	PUPPY	\N	FEMALE	SMALL
5	Post	Aspin	Rescue	2024-06-05 00:00:00	Friendly	Healthy	{uploads/dogs/1751399303583-Adopt-Post-1024x1024.jpg}	2000	2000	2000	2000	0	2000	2000	AVAILABLE	2025-07-01 19:48:23.585	2025-07-01 19:48:23.585	PUPPY	\N	MALE	MEDIUM
6	Bogart	Pomeranian	Purebred	2024-11-13 00:00:00	Aggressive	Healthy	{uploads/dogs/1751400011672-img_1920x_68621f4dd09716-04173760-55456099.jpg}	6000	0	0	0	0	0	0	AVAILABLE	2025-07-01 20:00:11.674	2025-07-01 20:00:11.674	PUPPY	\N	MALE	SMALL
7	Chopper	French Bulldog	Purebred	2025-07-01 00:00:00	Friendly	Healthy	{uploads/dogs/1751400876868-img_x500_6858d73b002d47-54525211-59014192.jpg}	60000	0	0	0	0	0	0	AVAILABLE	2025-07-01 20:14:36.869	2025-07-01 20:14:36.869	PUPPY	\N	MALE	MEDIUM
2	Quila	Maltese	Purebred	2023-04-12 00:00:00	Friendly	Healthy	{uploads/dogs/1751330539256-502636617_23973432968936118_3562021281942038516_n.jpg}	10000	2000	2000	2000	2000	2000	2000	PENDING	2025-07-01 00:42:19.259	2025-07-01 21:18:53.45	PUPPY	\N	FEMALE	SMALL
9	Vin	Pomeranian	Purebred	\N	Active	Healthy	{uploads/dogs/1751415658878-img_1920x_68621f4dd09716-04173760-55456099.jpg}	10000	0	0	0	0	0	0	AVAILABLE	2025-07-02 00:20:58.88	2025-07-02 00:20:58.88	PUPPY	\N	MALE	SMALL
8	Mila	Labrador	Purebred	\N	Calm	Healthy	{uploads/dogs/1751401328254-img_x500_683c1fb31368d5-63179622-19261991.jpeg}	6000	0	0	0	0	0	0	PENDING	2025-07-01 20:22:08.286	2025-07-02 00:21:26.155	PUPPY	\N	UNKNOWN	SMALL
\.


--
-- Data for Name: DogApplication; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."DogApplication" (id, "buyerId", "dogId", message, status, "adminNote", "createdAt", "updatedAt", "withdrawNote") FROM stdin;
1	7	2	cute dog	WITHDRAWN	\N	2025-07-01 01:38:34.28	2025-07-01 01:55:33.253	yawqn
3	7	1	dawg	APPROVED	\N	2025-07-01 03:24:29.853	2025-07-01 03:24:57.587	\N
2	7	2	nice	WITHDRAWN	\N	2025-07-01 01:57:42.504	2025-07-01 03:50:23.744	la lang
4	8	4	i like winnie	APPROVED	\N	2025-07-01 17:43:13.781	2025-07-01 17:43:28.501	\N
5	15	2	nice	APPROVED	\N	2025-07-01 21:18:45.777	2025-07-01 21:18:53.455	\N
6	17	8	my home would be great for this breed	APPROVED	\N	2025-07-02 00:20:17.706	2025-07-02 00:21:26.161	\N
\.


--
-- Data for Name: DogDocument; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."DogDocument" (id, "dogId", "fileName", "filePath", "fileType", "uploadedById", description, "createdAt") FROM stdin;
\.


--
-- Data for Name: FavoriteDog; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."FavoriteDog" (id, "userId", "dogId", "createdAt") FROM stdin;
13	10	8	2025-07-01 20:42:41.878
18	16	8	2025-07-01 23:13:29.858
19	16	7	2025-07-01 23:13:30.826
20	17	8	2025-07-02 00:19:20.037
21	17	7	2025-07-02 00:19:22.345
\.


--
-- Data for Name: FinanceEntry; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."FinanceEntry" (id, type, category, amount, description, date, "createdById") FROM stdin;
\.


--
-- Data for Name: Invoice; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Invoice" (id, "applicationId", amount, breakdown, status, "paidAt", "rehomedAt", "createdAt", "updatedAt") FROM stdin;
1	3	10000	[{"amount": 500, "description": "Adoption Fees"}, {"amount": 1000, "description": "Food 1 Month"}]	PENDING	\N	\N	2025-07-01 03:58:53.62	2025-07-01 03:58:53.62
2	5	10000	[{"amount": 1000, "description": "extra feez"}]	PENDING	\N	\N	2025-07-01 21:19:21.079	2025-07-01 21:19:21.079
3	4	11111	[{"amount": 111, "description": "11"}]	PENDING	\N	\N	2025-07-01 21:24:06.893	2025-07-01 21:24:06.893
\.


--
-- Data for Name: InvoiceAuditLog; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."InvoiceAuditLog" (id, "invoiceId", "userId", action, changes, "createdAt") FROM stdin;
\.


--
-- Data for Name: Message; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Message" (id, "conversationId", "senderId", content, "isRead", "createdAt") FROM stdin;
2	2	1	🎉 Congratulations! Your application for Champion has been approved!\n\nNext Steps:\n1. We'll be in touch via this chat to discuss the adoption process\n2. You'll receive an invoice with the adoption fee breakdown\n3. We'll provide vaccination records and health information\n4. Once payment is confirmed, we'll arrange for you to meet your new furry friend\n\nPlease check this chat regularly for updates and feel free to ask any questions!	f	2025-07-01 03:24:58.258
3	2	1	hiii	f	2025-07-01 03:35:28.944
4	2	1	📋 Invoice Generated for Champion\n\nTotal Amount: ₱10000\n\nBreakdown:\n• Adoption Fees: ₱500\n• Food 1 Month: ₱1000\n\nPlease review the invoice and let us know if you have any questions. Once you're ready to proceed, you can upload your payment receipt in this chat.	f	2025-07-01 03:58:53.628
5	3	1	🎉 Congratulations! Your application for Winnie has been approved!\n\nNext Steps:\n1. We'll be in touch via this chat to discuss the adoption process\n2. You'll receive an invoice with the adoption fee breakdown\n3. We'll provide vaccination records and health information\n4. Once payment is confirmed, we'll arrange for you to meet your new furry friend\n\nPlease check this chat regularly for updates and feel free to ask any questions!	f	2025-07-01 17:43:29.322
6	3	1	TEST	f	2025-07-01 17:52:04.958
7	3	8	TEST	t	2025-07-01 17:52:13.131
1	2	7	hello	t	2025-07-01 01:39:50.409
8	3	8	test	t	2025-07-01 17:59:59.185
9	3	8	test	t	2025-07-01 18:03:12.586
10	5	1	🎉 Congratulations! Your application for Quila has been approved!\n\nNext Steps:\n1. We'll be in touch via this chat to discuss the adoption process\n2. You'll receive an invoice with the adoption fee breakdown\n3. We'll provide vaccination records and health information\n4. Once payment is confirmed, we'll arrange for you to meet your new furry friend\n\nPlease check this chat regularly for updates and feel free to ask any questions!	f	2025-07-01 21:18:54.289
11	5	1	📋 Invoice Generated for Quila\n\nTotal Amount: ₱10000\n\nBreakdown:\n• extra feez: ₱1000\n\nPlease review the invoice and let us know if you have any questions. Once you're ready to proceed, you can upload your payment receipt in this chat.	f	2025-07-01 21:19:21.084
12	3	1	📋 Invoice Generated for Winnie\n\nTotal Amount: ₱11111\n\nBreakdown:\n• 11: ₱111\n\nPlease review the invoice and let us know if you have any questions. Once you're ready to proceed, you can upload your payment receipt in this chat.	f	2025-07-01 21:24:06.897
13	3	1	sup	f	2025-07-01 21:30:42.551
14	3	1	hi	f	2025-07-01 22:19:30.013
15	6	1	🎉 Congratulations! Your application for Mila has been approved!\n\nNext Steps:\n1. We'll be in touch via this chat to discuss the adoption process\n2. You'll receive an invoice with the adoption fee breakdown\n3. We'll provide vaccination records and health information\n4. Once payment is confirmed, we'll arrange for you to meet your new furry friend\n\nPlease check this chat regularly for updates and feel free to ask any questions!	f	2025-07-02 00:21:27.064
16	6	17	thanks	t	2025-07-02 00:21:47.789
\.


--
-- Data for Name: MessageAttachment; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."MessageAttachment" (id, "messageId", "fileName", "filePath", "fileType", "fileSize", "createdAt") FROM stdin;
\.


--
-- Data for Name: OTP; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."OTP" (id, "userId", code, "expiresAt", used, "createdAt") FROM stdin;
44	1	833324	2025-07-01 21:29:48.933	f	2025-07-01 21:24:48.935
45	1	671885	2025-07-01 21:40:33.002	f	2025-07-01 21:35:33.003
46	1	777297	2025-07-01 22:23:38.527	t	2025-07-01 22:18:38.528
47	16	568850	2025-07-01 23:16:20.302	t	2025-07-01 23:11:20.304
48	1	458312	2025-07-01 23:45:30.794	f	2025-07-01 23:40:30.795
49	1	972713	2025-07-02 00:15:07.59	f	2025-07-02 00:10:07.592
50	1	113822	2025-07-02 00:21:17.246	t	2025-07-02 00:16:17.247
51	17	210023	2025-07-02 00:22:06.282	t	2025-07-02 00:17:06.283
25	2	308568	2025-06-30 21:21:11.039	t	2025-06-30 21:16:11.04
26	1	991098	2025-06-30 21:32:14.762	f	2025-06-30 21:27:14.764
27	3	766969	2025-06-30 21:38:18.44	t	2025-06-30 21:33:18.441
28	4	760840	2025-06-30 21:41:22.059	t	2025-06-30 21:36:22.06
29	5	673081	2025-06-30 21:45:01.906	t	2025-06-30 21:40:01.908
30	1	973424	2025-06-30 22:18:44.916	f	2025-06-30 22:13:44.918
31	6	222198	2025-06-30 22:37:03.828	t	2025-06-30 22:32:03.829
32	7	625132	2025-07-01 01:37:10.301	t	2025-07-01 01:32:10.302
33	1	369438	2025-07-01 03:25:15.907	f	2025-07-01 03:20:15.909
34	7	160771	2025-07-01 03:56:58.715	t	2025-07-01 03:51:58.715
35	8	162380	2025-07-01 17:46:18.419	t	2025-07-01 17:41:18.42
36	1	768723	2025-07-01 19:47:07.11	f	2025-07-01 19:42:07.111
37	9	667640	2025-07-01 20:28:17.843	t	2025-07-01 20:23:17.844
38	10	118326	2025-07-01 20:38:10.792	t	2025-07-01 20:33:10.793
39	11	533542	2025-07-01 20:55:17.96	t	2025-07-01 20:50:17.961
40	12	117455	2025-07-01 20:59:24.468	t	2025-07-01 20:54:24.469
41	13	404466	2025-07-01 21:04:01.409	t	2025-07-01 20:59:01.41
42	14	287509	2025-07-01 21:08:46.109	t	2025-07-01 21:03:46.11
43	15	865851	2025-07-01 21:12:59.955	t	2025-07-01 21:07:59.956
\.


--
-- Data for Name: Session; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Session" (id, "userId", token, "createdAt", "expiresAt") FROM stdin;
17	2	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImlhdCI6MTc1MTMxODE5MywiZXhwIjoxNzUxNDA0NTkzfQ.z7DxWcDI2Ggk47QBmqeqvCnbpyqS6RWgQinp4rhC6Yc	2025-06-30 21:16:33.556	2025-07-01 21:16:33.555
19	3	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImlhdCI6MTc1MTMxOTIwOCwiZXhwIjoxNzUxNDA1NjA4fQ.pwMtenuGn4ekcLaisUfljWoHU3m3HUTQKInjAeWBI2U	2025-06-30 21:33:28.106	2025-07-01 21:33:28.105
20	4	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQsImlhdCI6MTc1MTMxOTM5MywiZXhwIjoxNzUxNDA1NzkzfQ.7zrl2oGQDWLLDmxXqVGryG_oP2KBQuANhUtEDbidtPU	2025-06-30 21:36:33.862	2025-07-01 21:36:33.861
21	5	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjUsImlhdCI6MTc1MTMxOTYxNiwiZXhwIjoxNzUxNDA2MDE2fQ.2p91BpkbUj0aQGXV_o7tr3CFEQ9jWRwBwAsDNDs8jW0	2025-06-30 21:40:16.191	2025-07-01 21:40:16.19
23	6	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjYsImlhdCI6MTc1MTMyMjc2NSwiZXhwIjoxNzUxNDA5MTY1fQ.k2-BhwLEloOwtFzCTz6unLtbgQ6zk-GNNfI-VnqFKHk	2025-06-30 22:32:45.63	2025-07-01 22:32:45.629
26	7	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjcsImlhdCI6MTc1MTM0MTkzNSwiZXhwIjoxNzUxNDI4MzM1fQ.JK4TqSEY47Ke9cFrU4KHC5XESvOCBFvWjJDMD-VzZTg	2025-07-01 03:52:15.894	2025-07-02 03:52:15.893
27	8	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjgsImlhdCI6MTc1MTM5MTY5OSwiZXhwIjoxNzUxNDc4MDk5fQ.s7D8lEHoX8ExCgSszgQfQ_JbWCbPJIW22ox3yo5L7wQ	2025-07-01 17:41:39.629	2025-07-02 17:41:39.628
29	9	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjksImlhdCI6MTc1MTQwMTQxNCwiZXhwIjoxNzUxNDg3ODE0fQ.-PA3kX8x3nOn3NuXHefTGV9S6ytR8PUMdVn6gPp4BPM	2025-07-01 20:23:34.12	2025-07-02 20:23:34.119
30	10	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEwLCJpYXQiOjE3NTE0MDIwMDgsImV4cCI6MTc1MTQ4ODQwOH0.JgntEOah3vZ3VlIjCrM8TQfuRKCNJpFBO-x8tswhLM8	2025-07-01 20:33:28.257	2025-07-02 20:33:28.256
31	11	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjExLCJpYXQiOjE3NTE0MDMwMjgsImV4cCI6MTc1MTQ4OTQyOH0.m7qqvJkrROToSuileL6C0C9UZLrinrZSF4ebA7ekupE	2025-07-01 20:50:28.765	2025-07-02 20:50:28.764
32	12	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEyLCJpYXQiOjE3NTE0MDMyNzksImV4cCI6MTc1MTQ4OTY3OX0.MX_ic14K3vsYsLbFIsJGrNZpjYfAnqO8a9Aza_Fgvlw	2025-07-01 20:54:39.157	2025-07-02 20:54:39.156
33	13	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEzLCJpYXQiOjE3NTE0MDM1NTMsImV4cCI6MTc1MTQ4OTk1M30.nDif1kaAezcdH6gKTUMv17ng_1E9rdKsSmsY5PiiHas	2025-07-01 20:59:13.464	2025-07-02 20:59:13.463
34	14	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjE0LCJpYXQiOjE3NTE0MDM4MzQsImV4cCI6MTc1MTQ5MDIzNH0.HoNrnyxPawSwg-ILqr8aaMHfbBizIzAgq1NS7rop0bo	2025-07-01 21:03:54.158	2025-07-02 21:03:54.157
35	15	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjE1LCJpYXQiOjE3NTE0MDQwOTIsImV4cCI6MTc1MTQ5MDQ5Mn0.atsy5B8ouQqCmS37F3YRBi4yQpo3qr8-zGUSqYh_tNY	2025-07-01 21:08:13.018	2025-07-02 21:08:13.017
39	16	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjE2LCJpYXQiOjE3NTE0MTE1MTcsImV4cCI6MTc1MTQ5NzkxN30.eY8onwqP2MR6DkKkvl4ojSExB3euWQWC-nwVjGc_qgU	2025-07-01 23:11:57.538	2025-07-02 23:11:57.537
42	1	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc1MTQxNTM5OCwiZXhwIjoxNzUxNTAxNzk4fQ.synEQC9N0Hz6xw7TA7ZRlq-P8ZDmVRJCXuj9tokebiA	2025-07-02 00:16:38.718	2025-07-03 00:16:38.717
43	17	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjE3LCJpYXQiOjE3NTE0MTU0NDAsImV4cCI6MTc1MTUwMTg0MH0.tmwbqwgY9kvBWCZRqKlnDMb_-GtOelyot5s-iIPrXr8	2025-07-02 00:17:20.284	2025-07-03 00:17:20.283
\.


--
-- Data for Name: Transaction; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Transaction" (id, "buyerId", "dogId", "processedById", date, price, "totalCost", profit, receipt, status) FROM stdin;
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."User" (id, email, password, name, role, "createdAt", "updatedAt", "isActive") FROM stdin;
1	laurel.j.bscs@gmail.com	$2b$10$lE0AGpmplKXDivXt11aJWuB4cDxI9dThvW80MFp9UgsBcfa438F5e	PawMart Admin	ADMIN	2025-06-30 21:14:41.976	2025-06-30 21:14:41.976	t
2	maxemof934@exitbit.com	$2b$10$dZwCB5AvPfBpoH4B43HNS.SrLZExEbBkKIBuQemBE3.seFCrksSxK	Maxemof	BUYER	2025-06-30 21:16:11.038	2025-07-01 01:28:22.703	t
3	vewega1871@iridales.com	$2b$10$s3sHD6enaba978ZA63G8uu25582l9Ew98EfBxuWz/1xfDptl/Dqwq	diffbrowsertest	BUYER	2025-06-30 21:33:18.439	2025-07-01 01:28:22.703	t
4	kodebef517@coasah.com	$2b$10$2E15/4Y5kvne8RcYvRh/kOqUNr.SEHxe5z1BQ9QwydYr.7EV/13ea	incog	BUYER	2025-06-30 21:36:22.058	2025-07-01 01:28:22.703	t
5	yajowew919@boxmach.com	$2b$10$so8DnSG3SQ.VVFatoVH4AuIb1fl9byL9Xur6fmhQPrTCrihVGNnkq	incog2	BUYER	2025-06-30 21:40:01.905	2025-07-01 01:28:22.703	t
6	tiler72532@exitbit.com	$2b$10$BNuMUFnRBCvWLlHo4hBs6em3Rx7Yr2pqmsThL.e9e2KjcmdLC.aw6	tyler	BUYER	2025-06-30 22:32:03.827	2025-07-01 01:28:22.703	t
7	xorif64493@boxmach.com	$2b$10$5Eg.bFZzKxjWPdJ6UC8X5.lX2iY/lIinKzKJF2aGs4.MKZ95s6tTq	xorif	BUYER	2025-07-01 01:32:10.293	2025-07-01 01:32:10.293	t
8	bosapal643@exitbit.com	$2b$10$GWi2TSuEb9EaIcSavgxRjuBMbcseAZbOxkD.Ft1P6P3Y0yaQvDsHS	bosapal	BUYER	2025-07-01 17:41:18.404	2025-07-01 17:41:18.404	t
9	kevehi9696@boxmach.com	$2b$10$6jBCsmSgs.wdv7yEoH/h9e2wxQG5/af1lCFEaLRnJg9/U5O6URtUK	kevehi	BUYER	2025-07-01 20:23:17.842	2025-07-01 20:23:17.842	t
10	ketife7790@asimarif.com	$2b$10$WTBESWgDYMJ9Lc0tOQLRM.K24J7ecO8.YuhEID6LXuSzIeRSHX076	ketife	BUYER	2025-07-01 20:33:10.791	2025-07-01 20:33:10.791	t
11	pikavok337@asimarif.com	$2b$10$QmCzUm6cxOjHUtIVzWKwUOhvnlJGlPbLJTEcJ.rLNUnOZDBlFd7m6	pikavok	BUYER	2025-07-01 20:50:17.959	2025-07-01 20:50:17.959	t
12	lenot59479@asimarif.com	$2b$10$LHvUJNfDyHvJwRVcyxM7eeL/fsK8j4BnhFbCZJ8TMCgAVom4U.Dpq	lenot	BUYER	2025-07-01 20:54:24.467	2025-07-01 20:54:24.467	t
13	yetene7895@boxmach.com	$2b$10$2IixJY0GMPElz9XVwJwDg.bEr9Q424kE1Xfpq/rRgVXwo9s7ryF2W	yetene	BUYER	2025-07-01 20:59:01.408	2025-07-01 20:59:01.408	t
14	xagegih825@asimarif.com	$2b$10$stuwe0UNuhaaDb0znATzw.0Aeb.UWAwnKby7teNJro7LjrNDH5L0O	xag	BUYER	2025-07-01 21:03:46.107	2025-07-01 21:03:46.107	t
15	demowi5701@exitbit.com	$2b$10$SOHmPPC4BYncw1Ey0Y87o.tyEH92qOTVFS5lB7Kx6vQOv8ogh1rsK	demo	BUYER	2025-07-01 21:07:59.953	2025-07-01 21:07:59.953	t
16	xiboye7985@decodewp.com	$2b$10$T2sz6.oCAko.gDbVYnBPjO7imJjcN8qiSDEz0zkQaXA1SMyHrRQJe	xiboye	BUYER	2025-07-01 23:11:20.287	2025-07-01 23:11:20.287	t
17	focela9423@asimarif.com	$2b$10$P6qdMtj7iGez.7WrGvVk2ucis37UeJxiPl4npjVpKNM.z6EbHaiIO	Test Buyer	BUYER	2025-07-02 00:17:06.281	2025-07-02 00:17:06.281	t
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
241656bc-9604-42d7-877e-aaca71f5b4fe	f1e0a534f29d3d214826ec65b4ec06cc13d879d034594873b432ec8637acde2f	2025-06-30 08:52:24.779449+08	20250630005224_init	\N	\N	2025-06-30 08:52:24.739232+08	1
550e7325-9d93-42b1-8754-f2a1030eaa0c	2756548d671eca3a5342019ee5503f1f1927ff3613c78799c84dce2852f5f37b	2025-06-30 09:06:51.423308+08	20250630010651_add_contact_message_model	\N	\N	2025-06-30 09:06:51.404496+08	1
1fe7d532-b94a-4bd5-8655-6d623cc2cd75	2ddb2389c9367e04dda9b22fa659f7e2af38e0194e635e0c34d70e48c96d7dd9	2025-07-01 02:30:54.058051+08	20250630183054_add_age_category	\N	\N	2025-07-01 02:30:54.015938+08	1
e6752e6c-a388-4ee9-844f-845210448142	00aad788c7434b708449597042896b3c079f657dc8097e8122bbbae31ed23322	2025-07-01 06:21:25.389655+08	20250630222125_add_dog_gender_size_age	\N	\N	2025-07-01 06:21:25.380513+08	1
0338e100-5de8-4daf-a62e-636a26c849dc	6cea534b23a95d3fed3feae51e0a30992212a4ccd1b774bd90eae8a3cefd055a	2025-07-01 07:55:39.074427+08	20250630235539_add_messaging_models	\N	\N	2025-07-01 07:55:39.051065+08	1
b45f17a0-6d6d-47b5-805b-bcba7f5fe0ea	7be247a76b79b2c7bc568aac67f9856c0a323dce73e07052c1c5cee48f284a46	2025-07-01 09:50:04.492953+08	20250701015004_add_withdraw_note_to_dog_application	\N	\N	2025-07-01 09:50:04.48791+08	1
7b625110-509b-4e10-8a28-5f4496c99135	a917526e31c0f93c1590585e77b9580e9210a1047d0cd087a14717bfc886dc39	2025-07-01 10:26:03.992342+08	20250701022603_add_messaging_attachments_and_invoices	\N	\N	2025-07-01 10:26:03.951159+08	1
62352bd5-10b1-478b-8bcc-8095a2f0ea95	552cd0363662b6daaf3d1a90122fbd1b1c06731e2afada1d352c11f2567b393d	2025-07-02 04:13:31.470341+08	20250701201331_add_user_bidirectional_relations	\N	\N	2025-07-02 04:13:31.439297+08	1
5c27c854-8844-4188-b3d7-9f7277e5c737	566affe394727b241e3bd0f5c58805b883aff8ba842fe5cabc7c24fca3e7142b	2025-07-02 04:20:20.461979+08	20250701201933_make_birthdate_nullable	\N	\N	2025-07-02 04:20:20.460438+08	1
\.


--
-- Name: BackgroundScreening_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."BackgroundScreening_id_seq"', 19, true);


--
-- Name: ContactMessage_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."ContactMessage_id_seq"', 9, true);


--
-- Name: Conversation_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Conversation_id_seq"', 6, true);


--
-- Name: DogApplication_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."DogApplication_id_seq"', 6, true);


--
-- Name: DogDocument_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."DogDocument_id_seq"', 1, false);


--
-- Name: Dog_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Dog_id_seq"', 9, true);


--
-- Name: FavoriteDog_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."FavoriteDog_id_seq"', 22, true);


--
-- Name: FinanceEntry_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."FinanceEntry_id_seq"', 1, false);


--
-- Name: InvoiceAuditLog_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."InvoiceAuditLog_id_seq"', 1, false);


--
-- Name: Invoice_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Invoice_id_seq"', 3, true);


--
-- Name: MessageAttachment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."MessageAttachment_id_seq"', 1, false);


--
-- Name: Message_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Message_id_seq"', 16, true);


--
-- Name: OTP_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."OTP_id_seq"', 51, true);


--
-- Name: Session_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Session_id_seq"', 43, true);


--
-- Name: Transaction_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."Transaction_id_seq"', 1, false);


--
-- Name: User_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."User_id_seq"', 17, true);


--
-- Name: BackgroundScreening BackgroundScreening_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BackgroundScreening"
    ADD CONSTRAINT "BackgroundScreening_pkey" PRIMARY KEY (id);


--
-- Name: ContactMessage ContactMessage_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ContactMessage"
    ADD CONSTRAINT "ContactMessage_pkey" PRIMARY KEY (id);


--
-- Name: Conversation Conversation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Conversation"
    ADD CONSTRAINT "Conversation_pkey" PRIMARY KEY (id);


--
-- Name: DogApplication DogApplication_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DogApplication"
    ADD CONSTRAINT "DogApplication_pkey" PRIMARY KEY (id);


--
-- Name: DogDocument DogDocument_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DogDocument"
    ADD CONSTRAINT "DogDocument_pkey" PRIMARY KEY (id);


--
-- Name: Dog Dog_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Dog"
    ADD CONSTRAINT "Dog_pkey" PRIMARY KEY (id);


--
-- Name: FavoriteDog FavoriteDog_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."FavoriteDog"
    ADD CONSTRAINT "FavoriteDog_pkey" PRIMARY KEY (id);


--
-- Name: FinanceEntry FinanceEntry_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."FinanceEntry"
    ADD CONSTRAINT "FinanceEntry_pkey" PRIMARY KEY (id);


--
-- Name: InvoiceAuditLog InvoiceAuditLog_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."InvoiceAuditLog"
    ADD CONSTRAINT "InvoiceAuditLog_pkey" PRIMARY KEY (id);


--
-- Name: Invoice Invoice_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Invoice"
    ADD CONSTRAINT "Invoice_pkey" PRIMARY KEY (id);


--
-- Name: MessageAttachment MessageAttachment_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MessageAttachment"
    ADD CONSTRAINT "MessageAttachment_pkey" PRIMARY KEY (id);


--
-- Name: Message Message_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_pkey" PRIMARY KEY (id);


--
-- Name: OTP OTP_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OTP"
    ADD CONSTRAINT "OTP_pkey" PRIMARY KEY (id);


--
-- Name: Session Session_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_pkey" PRIMARY KEY (id);


--
-- Name: Transaction Transaction_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Transaction"
    ADD CONSTRAINT "Transaction_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: BackgroundScreening_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "BackgroundScreening_userId_key" ON public."BackgroundScreening" USING btree ("userId");


--
-- Name: Conversation_buyerId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Conversation_buyerId_key" ON public."Conversation" USING btree ("buyerId");


--
-- Name: FavoriteDog_userId_dogId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "FavoriteDog_userId_dogId_key" ON public."FavoriteDog" USING btree ("userId", "dogId");


--
-- Name: Invoice_applicationId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Invoice_applicationId_key" ON public."Invoice" USING btree ("applicationId");


--
-- Name: Session_token_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Session_token_key" ON public."Session" USING btree (token);


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: BackgroundScreening BackgroundScreening_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."BackgroundScreening"
    ADD CONSTRAINT "BackgroundScreening_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: ContactMessage ContactMessage_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ContactMessage"
    ADD CONSTRAINT "ContactMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Conversation Conversation_buyerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Conversation"
    ADD CONSTRAINT "Conversation_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: DogApplication DogApplication_buyerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DogApplication"
    ADD CONSTRAINT "DogApplication_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: DogApplication DogApplication_dogId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DogApplication"
    ADD CONSTRAINT "DogApplication_dogId_fkey" FOREIGN KEY ("dogId") REFERENCES public."Dog"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: DogDocument DogDocument_dogId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DogDocument"
    ADD CONSTRAINT "DogDocument_dogId_fkey" FOREIGN KEY ("dogId") REFERENCES public."Dog"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: DogDocument DogDocument_uploadedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."DogDocument"
    ADD CONSTRAINT "DogDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: FavoriteDog FavoriteDog_dogId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."FavoriteDog"
    ADD CONSTRAINT "FavoriteDog_dogId_fkey" FOREIGN KEY ("dogId") REFERENCES public."Dog"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: FavoriteDog FavoriteDog_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."FavoriteDog"
    ADD CONSTRAINT "FavoriteDog_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: FinanceEntry FinanceEntry_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."FinanceEntry"
    ADD CONSTRAINT "FinanceEntry_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: InvoiceAuditLog InvoiceAuditLog_invoiceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."InvoiceAuditLog"
    ADD CONSTRAINT "InvoiceAuditLog_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES public."Invoice"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: InvoiceAuditLog InvoiceAuditLog_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."InvoiceAuditLog"
    ADD CONSTRAINT "InvoiceAuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Invoice Invoice_applicationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Invoice"
    ADD CONSTRAINT "Invoice_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES public."DogApplication"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: MessageAttachment MessageAttachment_messageId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MessageAttachment"
    ADD CONSTRAINT "MessageAttachment_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES public."Message"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Message Message_conversationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES public."Conversation"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Message Message_senderId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: OTP OTP_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."OTP"
    ADD CONSTRAINT "OTP_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Session Session_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Transaction Transaction_buyerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Transaction"
    ADD CONSTRAINT "Transaction_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Transaction Transaction_dogId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Transaction"
    ADD CONSTRAINT "Transaction_dogId_fkey" FOREIGN KEY ("dogId") REFERENCES public."Dog"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Transaction Transaction_processedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Transaction"
    ADD CONSTRAINT "Transaction_processedById_fkey" FOREIGN KEY ("processedById") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

