--
-- PostgreSQL database dump
--

\restrict ueUDmUXsHw3YbF3GfVUzAlnW7b9kv9fxqzSWFhxnNyU5LSoQfAGRpmAFTm17g8H

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.8 (Homebrew)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: admin_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    device_id text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: admin_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.admin_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    admin_password text NOT NULL
);


--
-- Name: announcements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.announcements (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    content text,
    author text,
    is_pinned boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    author_id uuid
);


--
-- Name: av_team; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.av_team (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    full_name text NOT NULL,
    email text NOT NULL,
    title text,
    company text DEFAULT 'Alumni Ventures'::text,
    club_role text DEFAULT 'Mentor'::text,
    bio text,
    emoji text DEFAULT '👤'::text,
    fun_fact text,
    linkedin_url text,
    phone text,
    location text,
    timezone text DEFAULT 'America/New_York'::text,
    is_active boolean DEFAULT true,
    is_visible_to_members boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    photo_url text
);


--
-- Name: candidates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.candidates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    cohort_id uuid,
    first_name text NOT NULL,
    last_name text NOT NULL,
    email text NOT NULL,
    linkedin_url text,
    source_tag text DEFAULT 'other'::text,
    stage text DEFAULT 'lead'::text,
    decision text DEFAULT 'undecided'::text,
    decision_set_at timestamp with time zone,
    decision_set_by text,
    application jsonb DEFAULT '{}'::jsonb,
    interview_scorecard jsonb DEFAULT '{}'::jsonb,
    interview_notes text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: cohorts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cohorts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    start_date date,
    target_size integer DEFAULT 20,
    region_focus text DEFAULT 'US - National'::text,
    status text DEFAULT 'recruiting'::text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: content; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.content (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    type text DEFAULT 'article'::text,
    category text,
    url text,
    duration text,
    thumbnail_url text,
    author text,
    file_name text,
    featured boolean DEFAULT false,
    sort_order integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: deal_interests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.deal_interests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    member_id uuid NOT NULL,
    deal_id uuid NOT NULL,
    interest_type text NOT NULL,
    investment_amount numeric,
    reason text,
    status text DEFAULT 'pending'::text,
    email_sent boolean DEFAULT false,
    email_sent_at timestamp with time zone,
    email_error text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    archived boolean DEFAULT false NOT NULL
);


--
-- Name: deals; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.deals (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_name text NOT NULL,
    headline text,
    sector text,
    stage text,
    description text,
    raise_amount text,
    valuation text,
    lead_investor text,
    av_allocation text,
    minimum_check text,
    status text DEFAULT 'new'::text,
    voting_deadline date,
    deal_deadline date,
    memo_url text,
    deck_url text,
    portal_url text,
    highlights jsonb DEFAULT '[]'::jsonb,
    risks jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    company_logo text,
    company_url text,
    additional_media jsonb DEFAULT '[]'::jsonb
);


--
-- Name: idea_bin; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.idea_bin (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid DEFAULT auth.uid() NOT NULL,
    title text NOT NULL,
    owner text,
    status_light text DEFAULT 'green'::text NOT NULL,
    "position" integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT idea_bin_status_light_check CHECK ((status_light = ANY (ARRAY['red'::text, 'yellow'::text, 'green'::text])))
);


--
-- Name: idea_bin_bullets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.idea_bin_bullets (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid DEFAULT auth.uid() NOT NULL,
    idea_id uuid NOT NULL,
    body text NOT NULL,
    "position" integer,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: intro_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.intro_requests (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    from_member_id uuid,
    to_member_id uuid,
    cohort_id uuid,
    reason text,
    note text,
    proposed_format text,
    suggested_format text,
    status text DEFAULT 'pending'::text,
    email_shared boolean DEFAULT false,
    email_shared_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    responded_at timestamp with time zone
);


--
-- Name: member_blocks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.member_blocks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    blocker_id uuid,
    blocked_id uuid,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: member_onboarding; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.member_onboarding (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    candidate_id uuid,
    cohort_id uuid,
    compliance_status text DEFAULT 'not_started'::text,
    profile_status text DEFAULT 'not_started'::text,
    wiring_on_file boolean DEFAULT false,
    entity_docs_on_file boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: member_reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.member_reports (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    reporter_id uuid,
    reported_id uuid,
    cohort_id uuid,
    reason text,
    note text,
    status text DEFAULT 'pending'::text,
    admin_notes text,
    reviewed_by text,
    reviewed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: member_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.member_sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    member_id uuid,
    device_id text NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.members (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    full_name text NOT NULL,
    email text NOT NULL,
    must_change_password boolean DEFAULT false,
    emoji text DEFAULT '👤'::text,
    headline text,
    photo_url text,
    phone text,
    location text,
    timezone text DEFAULT 'America/New_York'::text,
    linkedin_url text,
    whatsapp text,
    calendly_url text,
    preferred_contact text DEFAULT 'email'::text,
    member_role text,
    member_company text,
    sector_interests jsonb DEFAULT '[]'::jsonb,
    stage_interest jsonb DEFAULT '[]'::jsonb,
    geography_preference jsonb DEFAULT '[]'::jsonb,
    deal_role_preference jsonb DEFAULT '[]'::jsonb,
    theme_tags jsonb DEFAULT '[]'::jsonb,
    personal_statement text,
    why_joined text,
    hoping_to_get jsonb DEFAULT '[]'::jsonb,
    vc_experience_level text DEFAULT 'new'::text,
    learning_goals jsonb DEFAULT '[]'::jsonb,
    fun_fact text,
    outside_interests jsonb DEFAULT '[]'::jsonb,
    languages jsonb DEFAULT '[]'::jsonb,
    open_to_chats boolean DEFAULT true,
    chat_format text,
    best_times jsonb DEFAULT '[]'::jsonb,
    email_visible boolean DEFAULT false,
    whatsapp_visible boolean DEFAULT false,
    calendly_visible boolean DEFAULT false,
    onboarding_complete boolean DEFAULT false,
    code_of_conduct_accepted boolean DEFAULT false,
    is_manager boolean DEFAULT false,
    cohort_id uuid,
    admin_accreditation_status text,
    admin_check_size_band text,
    admin_past_av_investments boolean DEFAULT false,
    admin_investment_count integer DEFAULT 0,
    admin_compliance_flags jsonb DEFAULT '[]'::jsonb,
    admin_restricted_notes text,
    admin_agreement_signed boolean DEFAULT false,
    admin_internal_owner text,
    admin_internal_notes text,
    admin_last_contact_date date,
    created_at timestamp with time zone DEFAULT now(),
    migration_status text DEFAULT 'pending'::text,
    auth_user_id uuid,
    linkedin_connected boolean DEFAULT false,
    linkedin_sub text,
    linkedin_photo_url text,
    linkedin_name text,
    linkedin_connected_at timestamp with time zone
);


--
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    thread_id uuid,
    from_member_id uuid,
    to_member_id uuid,
    cohort_id uuid,
    intro_request_id uuid,
    content text NOT NULL,
    read boolean DEFAULT false,
    read_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: portfolio_investments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.portfolio_investments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    member_id uuid,
    news text,
    investment_date date,
    dd_report_url text,
    amount_invested numeric,
    cost_basis numeric,
    current_value numeric,
    exit_status text DEFAULT 'Active'::text,
    created_at timestamp with time zone DEFAULT now(),
    deal_id uuid
);


--
-- Name: recruit_stage_descriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recruit_stage_descriptions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    stage text NOT NULL,
    sort_order integer NOT NULL,
    short_label text NOT NULL,
    description text NOT NULL,
    action_required text,
    owner text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: recruits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recruits (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    email text,
    phone text,
    location text,
    linkedin_url text,
    bio text,
    source text,
    av_lead_id uuid,
    av_lead_name text,
    stage text DEFAULT 'interested'::text,
    notes text,
    documents jsonb DEFAULT '[]'::jsonb,
    temp_password text,
    temp_password_emailed boolean DEFAULT false,
    member_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT recruits_source_check CHECK ((source = ANY (ARRAY['personal_contact'::text, 'av_syndication'::text, 'events'::text, 'irl_events'::text, 'conferences'::text, 'referral'::text, 'typeform_application'::text, 'other'::text])))
);


--
-- Name: session_rsvps; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.session_rsvps (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id uuid,
    member_id uuid,
    attending boolean NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    description text,
    type text DEFAULT 'seminar'::text,
    date date,
    "time" text,
    timezone text DEFAULT 'EST'::text,
    duration integer DEFAULT 60,
    host_name text,
    host_title text,
    host_linkedin text,
    zoom_link text,
    recording_url text,
    deal_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    google_calendar_link text,
    attendees jsonb DEFAULT '[]'::jsonb,
    participants jsonb DEFAULT '[]'::jsonb,
    meeting_notes text DEFAULT ''::text
);


--
-- Name: site_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.site_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    club_name text DEFAULT 'Next Gen'::text,
    club_subtitle text DEFAULT 'Venture Club'::text,
    cohort_name text DEFAULT 'Cohort 1'::text,
    primary_color text DEFAULT '#1B4D5C'::text,
    accent_color text DEFAULT '#C9A227'::text,
    logo_url text DEFAULT '/av-logo.png'::text,
    created_at timestamp with time zone DEFAULT now(),
    logo_background_color text DEFAULT '#1B4D5C'::text,
    cohort_number text,
    email_test_mode boolean DEFAULT true
);


--
-- Data for Name: admin_sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.admin_sessions (id, device_id, is_active, created_at) FROM stdin;
335425d9-b367-41c5-b20e-8c65e8e5215c	admin-cate-login	t	2026-02-04 18:55:11.44714+00
\.


--
-- Data for Name: admin_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.admin_settings (id, admin_password) FROM stdin;
\.


--
-- Data for Name: announcements; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.announcements (id, title, content, author, is_pinned, created_at, author_id) FROM stdin;
\.


--
-- Data for Name: av_team; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.av_team (id, full_name, email, title, company, club_role, bio, emoji, fun_fact, linkedin_url, phone, location, timezone, is_active, is_visible_to_members, created_at, photo_url) FROM stdin;
62870c95-c676-488d-8610-6c8ed88a6055	Clare Brandfonbrener	clare@av.vc	Senior Associate	Alumni Ventures	Club President		initials		https://www.linkedin.com/in/clare-brandfonbrener/			America/New_York	t	t	2026-02-04 19:29:30.60043+00	
36f09d05-09bc-41e0-993d-59dadf94be87	Tuleeka Hazra	tuleeka@av.vc	Director, International Business Development	Alumni Ventures	Mentor		initials					America/New_York	t	t	2026-02-04 19:34:46.716947+00	
a532146b-4b2d-4af4-a6b8-e05bda786d01	Emily Hamilton	emily@av.vc	Community Manager	Alumni Ventures	Club Operations		initials					America/New_York	t	f	2026-03-23 13:54:45.471521+00	
65aa62ac-4a41-4fe9-8621-bae3f2defa96	Cate Woolsey	cate.woolsey@av.vc	AI Associate	Alumni Ventures	Club Operations	I recently graduated from Middlebury College, where I majored in Computer Science and minored in the History of Art and Architecture. My interests lie at the intersection of art, technology, and growth—exploring how creativity and innovation can drive meaningful experiences. With a background in both technical problem-solving and artistic analysis, I am passionate about designing and building solutions that blend functionality with aesthetics.	initials	I have a cat!	https://www.linkedin.com/in/catewoolsey/	+1(917)3193250	Manchester, NH	America/New_York	t	f	2026-02-04 19:23:49.618997+00	https://oqfawtqrmxuoiuwesmkt.supabase.co/storage/v1/object/public/profile-photos/profile-photos/1770233023565_2q76h2a81.jpg
1dad2d97-5006-486d-b39e-e70278e838fd	Colin Van Ostern	colin@av.vc	UK and EMEA	Alumni Ventures	Mentor	Colin is the incoming head of UK & EMEA for Alumni Ventures, where he previously worked as COO and President of the US business, helping the firm grow across the US.  Colin is an operator with a background in workforce development, higher ed, CPG, government and politics. Dartmouth MBA, George Washington University BA, currently living in London.	initials	Two sons, 12 & 15 years old.	https://www.linkedin.com/in/vanostern/		London, UK	Europe/London	t	f	2026-02-04 19:35:33.265147+00	
101a64ed-ad1a-413a-a648-e1c4501442b2	Mike Collins	mike@av.vc	Mentor	Alumni Ventures	Mentor	I've been a serial entrepreneur and investor since 1986. Started AV in 2013. My passion is at the intersection of entrepreneurship, technology, and investing. Our goal is to build the most value-creating venture investing firm on on the planet. 	initials	For fun. I love sports, both to participate and as a fan. I also read, paint, and love learning.			Manchester, NH	America/New_York	t	f	2026-02-04 19:33:29.001738+00	
bc408968-396c-434c-9b77-1e5dc3ab671e	Eoin Forker	eoin@av.vc	AI Associate	Alumni Ventures	Club Operations		initials				London, UK	Europe/London	t	f	2026-03-18 19:56:48.100935+00	https://oqfawtqrmxuoiuwesmkt.supabase.co/storage/v1/object/public/profile-photos/profile-photos/linkedin_28317c52-77ec-48dd-83d6-f5a697ef27a8_1776267481159.jpg
\.


--
-- Data for Name: candidates; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.candidates (id, cohort_id, first_name, last_name, email, linkedin_url, source_tag, stage, decision, decision_set_at, decision_set_by, application, interview_scorecard, interview_notes, created_at) FROM stdin;
\.


--
-- Data for Name: cohorts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cohorts (id, name, start_date, target_size, region_focus, status, created_at) FROM stdin;
\.


--
-- Data for Name: content; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.content (id, title, description, type, category, url, duration, thumbnail_url, author, file_name, featured, sort_order, created_at) FROM stdin;
\.


--
-- Data for Name: deal_interests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.deal_interests (id, member_id, deal_id, interest_type, investment_amount, reason, status, email_sent, email_sent_at, email_error, created_at, updated_at, archived) FROM stdin;
\.


--
-- Data for Name: deals; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.deals (id, company_name, headline, sector, stage, description, raise_amount, valuation, lead_investor, av_allocation, minimum_check, status, voting_deadline, deal_deadline, memo_url, deck_url, portal_url, highlights, risks, created_at, company_logo, company_url, additional_media) FROM stdin;
\.


--
-- Data for Name: idea_bin; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.idea_bin (id, user_id, title, owner, status_light, "position", created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: idea_bin_bullets; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.idea_bin_bullets (id, user_id, idea_id, body, "position", created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: intro_requests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.intro_requests (id, from_member_id, to_member_id, cohort_id, reason, note, proposed_format, suggested_format, status, email_shared, email_shared_at, created_at, responded_at) FROM stdin;
\.


--
-- Data for Name: member_blocks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.member_blocks (id, blocker_id, blocked_id, created_at) FROM stdin;
\.


--
-- Data for Name: member_onboarding; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.member_onboarding (id, candidate_id, cohort_id, compliance_status, profile_status, wiring_on_file, entity_docs_on_file, created_at) FROM stdin;
\.


--
-- Data for Name: member_reports; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.member_reports (id, reporter_id, reported_id, cohort_id, reason, note, status, admin_notes, reviewed_by, reviewed_at, created_at) FROM stdin;
\.


--
-- Data for Name: member_sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.member_sessions (id, member_id, device_id, is_active, created_at) FROM stdin;
4ee342cf-0b33-4b40-87db-beeff3dd3b00	e32b760c-6182-48bd-a742-88242433c146	device_omnevyrl5_1770235142655	t	2026-02-04 19:59:46.615373+00
88f64a72-41b6-47b9-8142-a38332892529	37e1b87c-dfcb-4c76-83fc-beed9df62cc9	device_rcp827u48_1770303380891	t	2026-02-05 17:46:50.563288+00
d885347c-7c17-4d29-911a-54cae339c93c	c600b6ea-6269-4125-bd26-16823ddb5fc1	device_te9o91mlb_1770354248148	t	2026-02-06 19:00:08.807287+00
0d100393-3fb0-4e91-a48e-e1387470042f	52784efa-06f7-4dba-a549-af66b5b44d25	device_y44j7zuck_1769536142228	t	2026-02-06 19:06:56.315498+00
b5cd4462-fe1b-4dda-9510-93797ad323f2	37e1b87c-dfcb-4c76-83fc-beed9df62cc9	device_hxokji3zk_1770644065615	t	2026-02-09 13:34:38.394321+00
15003dda-f0a6-48f1-b78f-b75948a9438d	462103ef-1368-43ad-a669-128b15429960	device_bnmagwbdo_1771518889734	t	2026-02-19 16:35:56.86523+00
fb946f5a-3283-4107-8a6e-44653063d14a	52784efa-06f7-4dba-a549-af66b5b44d25	device_b4nd2oaya_1771614140427	t	2026-02-20 19:24:56.953627+00
94e73421-3c3c-421f-84d5-c394243372a3	5d41e1a7-ab17-4870-8951-8c5757ef8fc8	device_oo9eskg3q_1772124132000	t	2026-02-26 16:42:48.141713+00
e0498845-9793-48ec-9ce9-59e6465332e0	52784efa-06f7-4dba-a549-af66b5b44d25	device_e9b626824_1770229618546	t	2026-03-18 19:56:22.142059+00
96d53de6-25d0-4e92-8685-7821dd95e742	72bb3b1b-e402-4db6-aef3-dff9f8b3ea47	device_pnujvrcv0_1774274247787	t	2026-03-23 13:58:08.057106+00
9b4a4ecb-fd37-4675-91e3-554c9372434a	28317c52-77ec-48dd-83d6-f5a697ef27a8	device_k4ky1ko0o_1773760870901	t	2026-03-30 21:11:27.799229+00
e62c783b-3c90-4b0b-8850-cf255bfca13e	28317c52-77ec-48dd-83d6-f5a697ef27a8	device_72ws58d42_1774905339608	t	2026-03-30 21:15:42.842644+00
f3baa49a-e0dd-4741-8368-8ea82b0e8720	28317c52-77ec-48dd-83d6-f5a697ef27a8	device_lluk2ukhl_1776267192459	t	2026-04-15 15:37:16.11505+00
28eeec64-06dd-4c63-9d2f-8e08ebd00d67	28317c52-77ec-48dd-83d6-f5a697ef27a8	device_huznpou83_1776267467680	t	2026-04-15 15:37:52.485569+00
\.


--
-- Data for Name: members; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.members (id, full_name, email, must_change_password, emoji, headline, photo_url, phone, location, timezone, linkedin_url, whatsapp, calendly_url, preferred_contact, member_role, member_company, sector_interests, stage_interest, geography_preference, deal_role_preference, theme_tags, personal_statement, why_joined, hoping_to_get, vc_experience_level, learning_goals, fun_fact, outside_interests, languages, open_to_chats, chat_format, best_times, email_visible, whatsapp_visible, calendly_visible, onboarding_complete, code_of_conduct_accepted, is_manager, cohort_id, admin_accreditation_status, admin_check_size_band, admin_past_av_investments, admin_investment_count, admin_compliance_flags, admin_restricted_notes, admin_agreement_signed, admin_internal_owner, admin_internal_notes, admin_last_contact_date, created_at, migration_status, auth_user_id, linkedin_connected, linkedin_sub, linkedin_photo_url, linkedin_name, linkedin_connected_at) FROM stdin;
e32b760c-6182-48bd-a742-88242433c146	Mike Collins	mike@av.vc	f	initials	Mentor		\N	Manchester, NH	America/New_York		\N	\N	email	Mentor	\N	[]	[]	[]	[]	[]	\N	\N	[]	new	[]	\N	[]	[]	f	\N	[]	f	f	f	f	f	t	\N	\N	\N	f	0	[]	\N	f	\N	\N	\N	2026-02-04 19:33:32.805651+00	pending	f6d59411-dc68-45e4-b697-2fe376458f78	f	\N	\N	\N	\N
37e1b87c-dfcb-4c76-83fc-beed9df62cc9	Ayla Langer	ayla@av.vc	f	initials	Mentor		\N	Chicago, IL	America/New_York		\N	\N	email	Mentor	\N	[]	[]	[]	[]	[]	\N	\N	[]	new	[]	\N	[]	[]	f	\N	[]	f	f	f	f	f	t	\N	\N	\N	f	0	[]	\N	f	\N	\N	\N	2026-02-05 17:38:20.962694+00	pending	1a6a6491-1c0e-4128-b106-9a3bce9baa09	f	\N	\N	\N	\N
462103ef-1368-43ad-a669-128b15429960	Tuleeka Hazra	tuleeka@av.vc	f	initials	Mentor		\N		America/New_York		\N	\N	email	Mentor	\N	[]	[]	[]	[]	[]	\N	\N	[]	new	[]	\N	[]	[]	f	\N	[]	f	f	f	f	f	t	\N	\N	\N	f	0	[]	\N	f	\N	\N	\N	2026-02-04 19:35:46.116254+00	pending	fe7e8e74-8cff-4c04-819f-930b67633352	f	\N	\N	\N	\N
72bb3b1b-e402-4db6-aef3-dff9f8b3ea47	Emily Hamilton	emily@av.vc	f	initials	Club Operations		\N		America/New_York		\N	\N	email	Club Operations	\N	[]	[]	[]	[]	[]	\N	\N	[]	new	[]	\N	[]	[]	f	\N	[]	f	f	f	f	f	t	\N	\N	\N	f	0	[]	\N	f	\N	\N	\N	2026-03-23 13:54:48.726275+00	pending	e94385f1-8ce2-4bb6-8acd-effe2fd684b7	f	\N	\N	\N	\N
52784efa-06f7-4dba-a549-af66b5b44d25	Cate Woolsey	cate.woolsey@av.vc	f	initials	Club Operations	https://oqfawtqrmxuoiuwesmkt.supabase.co/storage/v1/object/public/profile-photos/profile-photos/1770233023565_2q76h2a81.jpg	\N	Manchester, NH	America/New_York	https://www.linkedin.com/in/catewoolsey/	\N	\N	email	Club Operations	\N	[]	[]	[]	[]	[]	\N	\N	[]	new	[]	\N	[]	[]	f	\N	[]	f	f	f	f	f	t	\N	\N	\N	f	0	[]	\N	f	\N	\N	\N	2026-02-04 19:23:53.692958+00	pending	35fd6a22-d6b6-4c8a-960b-26dd6a3f6e42	t	\N	\N	\N	\N
c600b6ea-6269-4125-bd26-16823ddb5fc1	Colin Van Ostern	colin@av.vc	f	initials	Mentor		\N	London, UK	America/New_York	https://www.linkedin.com/in/vanostern/	\N	\N	email	Mentor	\N	[]	[]	[]	[]	[]	\N	\N	[]	new	[]	\N	[]	[]	f	\N	[]	f	f	f	f	f	t	\N	\N	\N	f	0	[]	\N	f	\N	\N	\N	2026-02-04 19:36:12.000635+00	pending	a3544676-e348-4b59-aed4-68daaa2cc5a7	t	\N	\N	\N	\N
5d41e1a7-ab17-4870-8951-8c5757ef8fc8	Clare Brandfonbrener	clare@av.vc	f	initials	Club President		\N		America/New_York	https://www.linkedin.com/in/clare-brandfonbrener/	\N	\N	email	Club President	\N	[]	[]	[]	[]	[]	\N	\N	[]	new	[]	\N	[]	[]	f	\N	[]	f	f	f	f	f	t	\N	\N	\N	f	0	[]	\N	f	\N	\N	\N	2026-02-04 19:29:35.198343+00	pending	6900c7a3-012e-4e6c-9cb0-d52483a62aa7	t	\N	\N	\N	\N
28317c52-77ec-48dd-83d6-f5a697ef27a8	Eoin Forker	eoin@av.vc	f	initials	Club Operations	https://oqfawtqrmxuoiuwesmkt.supabase.co/storage/v1/object/public/profile-photos/profile-photos/linkedin_28317c52-77ec-48dd-83d6-f5a697ef27a8_1776267481159.jpg	\N	London, UK	America/New_York		\N	\N	email	Club Operations	\N	[]	[]	[]	[]	[]	\N	\N	[]	new	[]	\N	[]	[]	f	\N	[]	f	f	f	f	f	t	\N	\N	\N	f	0	[]	\N	f	\N	\N	\N	2026-03-18 19:56:51.639732+00	pending	ee3bb9e8-9131-491a-88f7-96b0945c6b20	t	_Jg376fOKv	https://oqfawtqrmxuoiuwesmkt.supabase.co/storage/v1/object/public/profile-photos/profile-photos/linkedin_28317c52-77ec-48dd-83d6-f5a697ef27a8_1776267481159.jpg	Eoin Forker	2026-04-15 15:38:01.547+00
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.messages (id, thread_id, from_member_id, to_member_id, cohort_id, intro_request_id, content, read, read_at, created_at) FROM stdin;
\.


--
-- Data for Name: portfolio_investments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.portfolio_investments (id, member_id, news, investment_date, dd_report_url, amount_invested, cost_basis, current_value, exit_status, created_at, deal_id) FROM stdin;
\.


--
-- Data for Name: recruit_stage_descriptions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.recruit_stage_descriptions (id, stage, sort_order, short_label, description, action_required, owner, created_at) FROM stdin;
\.


--
-- Data for Name: recruits; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.recruits (id, name, email, phone, location, linkedin_url, bio, source, av_lead_id, av_lead_name, stage, notes, documents, temp_password, temp_password_emailed, member_id, created_at, updated_at) FROM stdin;
f124a242-d3b5-4d37-8e86-2a7065cfcc51	Priya	priya.panse@hotmail.com	9259154532	San Francisco	\N	Work: Investment Strategy / investor relations | Education: Finance | Family Office Role: Investor / PM | VC Experience: Early learner | Investing Capacity: Not now, but soon | Authority: Independently | Interests: AI, sales, hiking, building things and creating things | Why Joining: Learn and start practicing	other	\N	typeform	applied	Applied via Typeform on 2/6/2026, 6:37:24 PM\nPrefers: Text / WhatsApp\nInterest: Decksy - its impressive how wonderful their output is with minimal prompting	[]	\N	f	\N	2026-02-06 18:37:25.906+00	2026-02-06 18:37:25.906+00
53636a8d-f570-423f-a159-07f888379172	Richard	richbrand99@gmail.com	2015778221	Nashville	\N	Work: Invest | Education: MBA, Chicago | Family Office Role: Principal | VC Experience: Experienced, looking to deepen pattern recognition | Investing Capacity: $100K-1M | Authority: Independently | Interests: SpaceX, Anthropic (sp?), pain management therapeutics, defense | Why Joining: deal flow & give back	other	\N	typeform	applied	Applied via Typeform on 2/6/2026, 7:16:31 PM\nPrefers: Email\nCommunities: Opal, IvyFON, Brahmin Partners, Miami\nInterest: SpaceX Elon. MAXONA Pharmaceuticals potent acute non opioid pain killer. Anthropic (sp?) winning AI\nNote: I think I can and be helped.	[]	\N	f	\N	2026-02-06 19:16:33.328+00	2026-02-06 19:16:33.328+00
fd32b956-8d13-415f-931c-d36535fa9f0d	Greg	gregowens32@yahoo.com	3153834270	Charlotte, NC	\N	Work: Security Engineer | Education: Masters | Family Office Role: N/A | VC Experience: Early learner | Investing Capacity: Not now, but soon | Authority: Independently | Interests: Entreprenuership | Why Joining: I’m interested in joining the NextGen Venture Club because it offers something most venture programs don’t — real deal flow, real decisions, and real capital at work alongside experienced investors. Learning venture by actually underwriting institutional-quality deals each month, collaborating with other serious investors, and building a curated portfolio together feels far more valuable than just theory or networking alone. The combination of disciplined deal review, access to top-tier co-investments, and an intimate cohort is exactly the kind of environment I want to sharpen my judgment and compound both my capital and my relationships in the venture ecosystem.	other	\N	typeform	applied	Applied via Typeform on 2/6/2026, 6:39:54 PM\nPrefers: Text / WhatsApp\nInterest: I’m particularly interested in the rise of AI-powered workflow automation for small and mid-sized businesses. Not just AI chatbots or content tools, but software that directly replaces repetitive labor inside service businesses, things like scheduling, quoting, customer support, bookkeeping, and operations management.\nNote: N/A	[]	\N	f	\N	2026-02-06 18:39:55.194+00	2026-02-06 19:00:47.763745+00
2554bf3d-0990-4235-aded-ae11c5e3fc58	Saad Raza	muhammadsaad@agentrax.net	+92 333 2858292	Karachi	\N	Work: Agentic AI Developer & Founder of AgentraX – No-code AI Agent Builder SaaS. Ex-Next.js Dev @N6N, React @RBAM. GIAIC/PIAIC Certified. Raising 5M PKR seed. | Education: intermediate | Family Office Role: Founder of Agentrax | VC Experience: Early learner | Investing Capacity: $100K-1M | Authority: Independently | Interests: Passionate about Agentic AI, autonomous systems & building no-code tools that empower non-coders.Professional: Scaling AgentraX SaaS, Next.js/React dev, GIAIC/PIAIC alumni, hackathons & startup ecosystem in Karachi. dreaming of AI revolution in Pakistan | Why Joining: AgentraX founder (Agentic AI SaaS). Joining Alumni Venture for mentorship, funding access, and network to raise a seed round and build Pakistan's AI future	other	\N	typeform	applied	Applied via Typeform on 2/6/2026, 7:04:57 PM\nPrefers: Text / WhatsApp\nInterest: Agentic AI – multi-agent systems turning AI into digital teams. Exciting in 2026 for orchestration, enterprise adoption, and no-code access. Building AgentraX around it to empower non-coders in Pakistan's ecosystem!	[]	\N	f	\N	2026-02-06 19:04:58.444+00	2026-02-06 19:04:58.444+00
12954e13-213a-4577-891f-18d647a1d204	Susanne	Susanne.wilke12@gmail.com	2032527931	Old Greenwich, CT	\N	Work: Investor | Education: PhD biochemistry, MBA Dartmouth | Family Office Role: Owner | VC Experience: Experienced, looking to deepen pattern recognition | Investing Capacity: $100K-1M | Authority: Independently | Interests: Investments in breakthrough technologies; travel, hiking, sports , opera | Why Joining: Sharing due diligence	other	\N	typeform	applied	Applied via Typeform on 2/6/2026, 8:32:12 PM\nPrefers: Text / WhatsApp\nAttends: AIF investments\nCommunities: AIF investments\nInterest: Healthtech - new revenue models	[]	\N	f	\N	2026-02-06 20:32:13.665+00	2026-02-06 20:32:13.665+00
fc9c42e2-c8d8-4fe0-bb1c-626d267030ec	Niso	niso_as2@hotmail.com	646 466 5222	New York	linkedin.com/in/aanoa	Work: Projects Development Manager | Education: Bachelor's degree in Civil Engineering | Family Office Role: None | VC Experience: Some exposure | Investing Capacity: $1M-$3M | Authority: Independently | Interests: Find Alternative Energy Solutions , Gambling | Why Joining: Meet with New Schema of Personal	other	\N	typeform	applied	Applied via Typeform on 2/6/2026, 9:08:11 PM\nPrefers: Text / WhatsApp\nInterest: AI Infrastructure Partnership (AIP) - the UAE’s MGX: Asset under management equivalent to $100B They aren't just selling software; they are acquiring the physical earth.\nNote: MGX They are using sovereign wealth to fund massive AI clusters. This isn't venture capital; it's Infrastructure Finance.	[]	\N	f	\N	2026-02-06 21:08:13.479+00	2026-02-06 21:08:13.479+00
eacfd94c-9a15-430e-a65f-5328f95cc85a	Perrin	perrin.chiles@gmail.com	3104333352	NYC	https://www.linkedin.com/in/perrin-chiles-351b182?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=ios_app	Work: Public/private investor & producer | Education: BA Economics & History | Family Office Role: Owner & CIO | VC Experience: Experienced, looking to deepen pattern recognition | Investing Capacity: $100K-1M | Authority: Independently | Interests: Kids, tennis, outdoors, music | Why Joining: Always learning ;-)	other	\N	typeform	applied	Applied via Typeform on 2/6/2026, 9:42:46 PM\nPrefers: Email\nInterest: SpaceX bc the possibilities for growth are seemingly limitless	[]	\N	f	\N	2026-02-06 21:42:48.112+00	2026-02-06 21:42:48.112+00
d07f2fac-61f6-486b-a346-2da5e82bb089	John	johnlee0212@gmail.com	88697885287	Taipei	https://www.linkedin.com/in/johntclee	Work: Gastroenterologist, Chief Venture Officer | Education: Executive MBA (Columbia), MD (TMU), PhD (NTU) | Family Office Role: Investment and incubation of business | VC Experience: Actively investing and learning | Investing Capacity: $100K-1M | Authority: Independently | Interests: innovation in medicine, healthtech | Why Joining: Learning more about global/impact through investment	other	\N	typeform	applied	Applied via Typeform on 2/7/2026, 3:29:30 AM\nPrefers: Email\nCommunities: Ligo partners\nInterest: Using AI to transform healthcare delivery\nNote: Multicultural immersion experience and past Medtech founder/CEO raised $10M VC funding base in Silicon Valley	[]	\N	f	\N	2026-02-07 03:29:32.435+00	2026-02-07 03:29:32.435+00
b49d434a-ccf0-457b-9362-103feb94e8ba	Dollar Dodge	sanjeev.bharadwaj@gmail.com	+919810083758	New Delhi,India.	sanjeev bharadwaj/linkedin.com	Work: Deep dive investing!Sector and stage,agnostic. | Education: Ph.D in Artificial Intelligence | Family Office Role: Chairman,CEO | VC Experience: Experienced, looking to deepen pattern recognition | Investing Capacity: >$5M | Authority: As part of a family office or similar structure | Interests: Economics,High Finance,Applying AI to the Fintech sector. | Why Joining: This professional intercourse,will enrichen all,I believe.	other	\N	typeform	applied	Applied via Typeform on 2/9/2026, 9:32:42 AM\nPrefers: Text / WhatsApp\nAttends: Which lend deeper insights,into the working,of a single family office.\nCommunities: Tiger 21 and Long Angle.\nInterest: Artificial Intelligence,as it's fairly and squarely poised,to disrupt,multiple domains.\nNote: I'm an aggressive,risk taker!	[]	\N	f	\N	2026-02-09 09:32:44.194+00	2026-02-09 09:32:44.194+00
3028702c-5b5e-4b0a-bb29-6e0eb8d3ef5f	Akhil	akhilnarang.55555@gmail.com	+919991881631	Delhi , India	https://www.linkedin.com/in/akhil-narang	Work: I work as a Consultant at Kaytes Consulting, where I specialize in valuation and advisory for venture capital funds. I have worked on valuations of 20+ VC funds, analyzing portfolio companies across sectors such as fintech, consumer, SaaS, and deep tech. My work involves financial modeling, performance analysis, and preparing valuation and advisory reports to support investment and decision-making. | Education: MBA - Finance , B.Sc(H) Mathematics | Family Office Role: I’m not formally involved in a family office. Professionally, I work in venture fund valuation and advisory, supporting VC funds and portfolio analysis. | VC Experience: Actively investing and learning | Investing Capacity: $100K-1M | Authority: In consultation with family or advisors | Interests: I’m curious about startups, finance, and emerging technologies and enjoy learning how new ideas turn into real businesses. Outside of work, I like playing sports, staying active, and relaxing with video games. | Why Joining: I’m interested in joining this club because I want to deepen my understanding of venture investing by learning through real deals and real decisions. Through my work in valuation and fund advisory, I spend a lot of time analyzing startups and VC portfolios, and this feels like a natural next step to build hands-on investment experience while learning from experienced investors. I’m also excited about being part of a community where I can exchange perspectives, learn from peers, and build long-term relationships in the venture ecosystem.	other	\N	typeform	applied	Applied via Typeform on 2/7/2026, 5:03:34 AM\nPrefers: Email\nAttends: Family Offices & Asset Management Summit\nInterest: Agnikul Cosmos	[]	\N	f	\N	2026-02-07 05:03:36.104+00	2026-02-07 05:03:36.104+00
3be04275-fd28-4c93-aa66-f1f7b818f251	Vijay	vijaychalam@yahoo.com	+12022102370	Washington, DC, USA	http://linkedin.com/in/vijay-venkatachalam	Work: Technology Consulting | Education: BS: Electronics & Communication Engineering, MS: Electrical Engineering, MS: Biomedical Engineering, MBA: International Business & Cyber Security, MIT CTO (Chief Technology Officer) Certification | Family Office Role: I am currently a sole investor in my family, and would like to learn the intricacies of venture capital investing to be able to teach other family members | VC Experience: Early learner | Investing Capacity: $100K-1M | Authority: Independently | Interests: Researching Emerging Technologies including AI, ML, Cryptocurrencies, Cyber Security, Investing, Hands-On Prototyping, Personal Development, Meditation | Why Joining: To learn in-depth about analyzing startups, venture capital investing, be associated and network with a smart and talented group of entrepreneurial minded folks.	other	\N	typeform	applied	Applied via Typeform on 2/8/2026, 1:39:31 AM\nPrefers: Email\nInterest: AI/ML/Quantum Computing as I think these technologies are currently the most powerful drivers of progress and change in the world, and since I have training in AI/ML, and am actively pursuing further research and consulting projects in these fields.\nNote: I have over 30 years of work experience in the technology field nationally and internationally, and seeing the evolution of these technologies and their applications in various fields.	[]	\N	f	\N	2026-02-08 01:39:32.984+00	2026-02-08 01:39:32.984+00
fdadb050-3b10-45df-905a-755950cdbc94	Pontus Edgren	pontus.edgren@icloud.com	+46-702-717712	Stockholm	https://www.linkedin.com/me?trk=p_mwlite_feed-secondary_nav	Work: Entrepreneur, Investor | Education: MBA | Family Office Role: Investment resp and mgmt | VC Experience: Actively investing and learning | Investing Capacity: $100K-1M | Authority: In consultation with family or advisors | Interests: Investing, TV, Film, Tennis, Golf, Travel | Why Joining: Investing, networking, curiosity	other	\N	typeform	applied	Applied via Typeform on 2/8/2026, 8:28:06 AM\nPrefers: Email\nInterest: Lovable, Swedish AI-firm.	[]	\N	f	\N	2026-02-08 08:28:07.8+00	2026-02-08 08:28:07.8+00
29e195a7-bb54-4759-b27d-c641bc4ebc32	Robert	rnewstead@guardrailfinance.com	+31653566457	Haarlem, Netherlands	https://www.linkedin.com/in/robertnewstead	Work: Commercial Real Estate Finance & Investments | Education: MBA, Finance and Real Estate | Family Office Role: I'm the principal of a company that I am structuring to be a micro family office at this point | VC Experience: Experienced, looking to deepen pattern recognition | Investing Capacity: $100K-1M | Authority: Independently | Interests: Spending time with family and friends, Muay Thai, traveling, reading, investing | Why Joining: I'd like to engage with like minded people thinking beyond the now related to empowering the next generation	other	\N	typeform	applied	Applied via Typeform on 2/8/2026, 9:41:20 AM\nPrefers: Email\nCommunities: Richard Wilson's Family Office\nInterest: Both defense and space because I see them being vital for the future, and because historically, public private investment in technology spearheaded a technological revolution after WW2.\nNote: Married with 2 children.	[]	\N	f	\N	2026-02-08 09:41:22.731+00	2026-02-08 09:41:22.731+00
1fce5144-6d27-4861-b0ad-9fced2b2edec	Roy	roybbarr@gmail.com	6178031413	Newton	https://www.linkedin.com/in/roy-barr-73458	Work: Invest on start ups and alternatives | Education: International political economy | Family Office Role: Invest and managing money | VC Experience: Actively investing and learning | Investing Capacity: $100K-1M | Authority: Independently | Interests: Technology and business Start up and growth. Olke biking skiing travel and work out and leaning | Why Joining: To lean from smart experience people	other	\N	typeform	applied	Applied via Typeform on 2/8/2026, 2:18:21 PM\nPrefers: Text / WhatsApp\nInterest: Cyber security, deep tech, Heath,\nNote: Looking forward to meet and learn	[]	\N	f	\N	2026-02-08 14:18:23.234+00	2026-02-08 14:18:23.234+00
002f4122-8338-4ecc-a380-1b20ca06dd7b	Madhav	namadhav@gmail.com	847-525-7025	Chicago	https://www.linkedin.com/in/madhav-nadendla-1123431/	Work: Management Consulting (Health Care) | Education: MS (Comp Sci) and MBA (Northwestern) | Family Office Role: Investor | VC Experience: Actively investing and learning | Investing Capacity: $1M-$3M | Authority: Independently | Interests: Solving complex business problems for clients, investments, golf, spending time with family and friends | Why Joining: I have been involved with Alumni Ventures Group (AVG) since 2020 and am deeply impressed by how the firm has helped democratize and transform access to venture capital. I am eager to leverage my 30+ years of strategy and management consulting experience across healthcare and other industries to support the firm’s continued success. \n\nHaving personally invested more than $2M in venture capital, I am enthusiastic about applying the lessons I have learned as an investor to sourcing, evaluating, and supporting high‑quality opportunities. I am passionate about the VC space, committed to making thoughtful, data‑driven investments, and excited to both contribute to and learn from a talented peer group. I also hold an MBA, which further strengthens my analytical and financial toolkit for this role.	other	\N	typeform	applied	Applied via Typeform on 2/8/2026, 2:52:49 PM\nPrefers: Email\nInterest: Lambda (GPU & Cloud focus) - Lambda is compelling because it sits at the infrastructure layer of the AI boom, with a clear thesis: make state-of-the-art AI compute more accessible, performant, and tailored to what modern AI teams actually need.\n\nAnthropic - Positioned well to drive productivity by excelling in reasoning, coding, and analysis, reducing errors and oversight in complex tasks. Enterprises in healthcare, finance, and legal gain faster automation and innovation from Claude’s enterprise-ready capabilities.	[]	\N	f	\N	2026-02-08 14:52:50.881+00	2026-02-08 14:52:50.881+00
27d33dd2-d754-4ca2-9d8a-585115b9a560	Bingo	bingo.herron@gmail.com	850-974-5308	Washington DC	http://linkedin.com/in/taylor-herron-5282822	Work: Palantir Technologies | Education: 2x Bachelors; 2x Masters; Doctorate in Business Candidate. | Family Office Role: I will be investing my own capital and am comfortable committing up to $100k a year. | VC Experience: Actively investing and learning | Investing Capacity: $100K-1M | Authority: Independently | Interests: Both; I am a life long student of business and am pursuing my doctorate focusing on how venture capital dynamics can influence small business success in accessing federal markets. | Why Joining: I appreciate the practical learning opportunity.  Over the last four years, I’ve immersed myself in various programs from Stanford, Columbia, Wharton, HBS, and MiT to close down core gaps in business knowledge.  At the same time, I dove head first into a unicorn start up to learn in the trenches, transitioned to Palantir to explore business development from that lense, served as a Venture Partner with Harpoon and now the Veteran Fund, and am working through my doctorate in business to get more surgical.  I value accelerated  learning in the messy world of real decisions.	other	\N	typeform	applied	Applied via Typeform on 2/8/2026, 2:57:47 PM\nPrefers: Text / WhatsApp\nInterest: Agentic AI / SaaS delivery models.  I appreciate the agility of SaaS to rapidly adapt to changing market dynamics - see that as core in modern markets.  I am interested in how companies are positioning themselves to capitalize on agentic AI’s potential to democratize software development and to find creative means to build robust, defensible business models in light of the changes here.\nNote: While interested in broad domains, have specific expertise in navigating federal markets.  To the degree any of the ventures we evaluate have dual purpose potential, eager to evaluate / contribute from that lense.	[]	\N	f	\N	2026-02-08 14:57:48.221+00	2026-02-08 14:57:48.221+00
74d3eee8-9d10-451d-a470-9238740ec1e8	Mahendra	mahendra.mavani@gmail.com	5124504888	Austin	https://www.linkedin.com/in/mahendramavani/	Work: Split between consulting and Investing | Education: Software Engineering + Executive MBA | Family Office Role: Primary decision maker | VC Experience: Actively investing and learning | Investing Capacity: $100K-1M | Authority: Independently | Interests: Personal Finance, Freedom (retirement) Planning, Off-the market Deal analysis, Partnership ventures | Why Joining: I want to partner with like-minded people to bounce back the ideas, analyze private deals and ultimately forge long-term relationship that goes including but beyond business. \nBesides I have multiple sources of private deals across the wide spectrum of real estate, operating business ownership, oil and gas. I would like to rely on the shared/herd intelligence of this investing club as I analyze and invest into those deals	other	\N	typeform	applied	Applied via Typeform on 2/8/2026, 2:59:34 PM\nPrefers: Email\nInterest: Beside the hype and buzz around AI everywhere, I am genuinely interested in companies that are applying new AI capabilities in a most innovative way to solve the problems that were otherwise out of traditional norms. \n\nBesides AI, I am also interested in ever-green (sometime referred as utility or 'boring' businesses) that are running the show behind the scene. For example, any company that is a critical supplier for ASML is a born-winner and I want piece of that\nNote: I like to read -  a lot. I don't get bored with reading due diligence reports, accounting summaries or  annual reports. I am also good (others  say 'very good') with math which means most 'napkin' calculation I do happens instantly and in my mind without any calculator or excel. \n\nI am also very good with rejecting multiple deals because either they don't fit my risk profile or I do not have kind of understanding of the field they represent. I am very selective with my investments - I must understand the business model and all the math behind it should be independently verifiable by me.	[]	\N	f	\N	2026-02-08 14:59:34.462+00	2026-02-08 14:59:34.462+00
f1f04da6-4a5f-479f-b011-47a13662e60a	Akshay Patel	apate68@gmail.com	8476910135	Chicago	https://www.linkedin.com/in/akshaydpatel/	Work: Clinical Research | Education: BS Neuroscience; MBA Operations Management | Family Office Role: I lead a global team to help execute studies in support of corporate goals | VC Experience: Actively investing and learning | Investing Capacity: Not now, but soon | Authority: Independently | Interests: Family first, Career Growth, and enjoying life to the fullest | Why Joining: To meet like minded individuals and to support each other	other	\N	typeform	applied	Applied via Typeform on 2/8/2026, 3:05:33 PM\nPrefers: Email\nInterest: AI, Space Travel / Commercialization, Robotics, and thoughtful community design	[]	\N	f	\N	2026-02-08 15:05:35.528+00	2026-02-08 15:05:35.528+00
564f15e4-7a4e-4d44-9797-e890c5bb54eb	timo	tcplatt@gmail.com	001.603.491.9792	Arroyo Séco, NM	https://www.linkedin.com/in/timo-platt-4a7b74	Work: Software executive | Education: college and post-grad degrees | Family Office Role: Lead manager | VC Experience: Actively investing and learning | Investing Capacity: Not now, but soon | Authority: In consultation with family or advisors | Interests: Reading, politics, sailboat racing and alpine/telemark skiing coach | Why Joining: Raising family investing awareness	other	\N	typeform	applied	Applied via Typeform on 2/8/2026, 3:53:38 PM\nPrefers: Email\nInterest: Operational AI and quantum computing\nNote: Would bring startup and growth company perspective to discussions	[]	\N	f	\N	2026-02-08 15:53:39.699+00	2026-02-08 15:53:39.699+00
16903309-c2c2-4d60-889f-8432affdac0f	Philip	maurerp0218@gmail.com	2677677641	Phila	https://www.linkedin.com/in/philip-maurer-md-774a9b23?utm_source=share_via&utm_content=profile&utm_medium=member_ios	Work: Clinical consulting and life science and tech investing | Education: Physician MD | Family Office Role: Founder and consultant | VC Experience: Actively investing and learning | Investing Capacity: $100K-1M | Authority: Independently | Interests: Life science , biotech and tech | Why Joining: Learn from others	other	\N	typeform	applied	Applied via Typeform on 2/8/2026, 4:19:02 PM\nPrefers: Email\nAttends: Several that offer seminar\nInterest: Biotech oncology and cell and gene  therapy, immunology\nNote: No	[]	\N	f	\N	2026-02-08 16:19:03.474+00	2026-02-08 16:19:03.474+00
f458a08e-2f73-41da-b41b-1e778cda92b9	Duncan	duncan.campbell03@gmail.com	2146638657	Dallas	http://linkedin.com/in/duncancampbell03	Work: Public Accounting Tax Partner | Education: Master of Science - Accounting | Family Office Role: Consultant to Family Office | VC Experience: Early learner | Investing Capacity: $100K-1M | Authority: Independently | Interests: Professional | Why Joining: Continual learning	other	\N	typeform	applied	Applied via Typeform on 2/8/2026, 4:20:24 PM\nPrefers: Email\nAttends: Family Wealth Magazine Legacy Conferences\nCommunities: Family Wealth Alliance, Family Business Magazine, FOX\nInterest: AI - generational technology, new energy generation tech	[]	\N	f	\N	2026-02-08 16:20:25.665+00	2026-02-08 16:20:25.665+00
585a5dbb-c1fc-4e24-b8ec-ed1737c7ebf6	Mario	myearwood@gmail.com	2037161664	Houston, TX	https://www.linkedin.com/in/mario-y-9956b6	Work: Artificial Intelligence (Mostly Natural Language Processing) | Education: MIT Bachelors and Masters in EECS and MIT Sloan MBA (Financial Engineering) | Family Office Role: It is just me by myself investing on behalf of my family. | VC Experience: Some exposure | Investing Capacity: Not now, but soon | Authority: Independently | Interests: Tech and Investing | Why Joining: I am interested in learning more about VC Investing.  I have been participating in Alumni Ventures syndications for a few years.	other	\N	typeform	applied	Applied via Typeform on 2/8/2026, 4:23:46 PM\nPrefers: Text / WhatsApp\nCommunities: I hold the CFA designation and attend Houston CFA society events.\nInterest: I have worked in the AI space for 10 years and I am astounded by the pace of innovation these days.  It is near impossible to keep track of every new development.  In addition to AI, I am interested in Fusion energy and would love to learn more about Quantum Computing.\nNote: I lived through the dot com bust and I see several similarities at the moment.	[]	\N	f	\N	2026-02-08 16:23:46.578+00	2026-02-08 16:23:46.578+00
84aa1e67-2b2e-41c0-9af6-32dd87995053	Peary	ww554@cornell.edu	+1(929)9965732 / +66(85)5549959	New York, Singapore, Bangkok	https://www.linkedin.com/in/waranun-w/	Work: Family Business and Angel Investing | Education: MBA | Family Office Role: Assistant Deputy Managing Director | VC Experience: Actively investing and learning | Investing Capacity: $100K-1M | Authority: In consultation with family or advisors | Interests: Consumers, Health Tech, AI | Why Joining: I am in investing space and want better sourcing and network	other	\N	typeform	applied	Applied via Typeform on 2/9/2026, 9:38:20 AM\nPrefers: Email\nInterest: VR-based eye glaucoma detection. Low hanging fruit in terms of tech application. High impact.\nNote: -	[]	\N	f	\N	2026-02-09 09:38:20.651+00	2026-02-09 09:38:20.651+00
fd907dc6-f1f4-42a3-b651-281e56984a88	Korey	k@outthefreezer.shop	9122293070	Macon	https://www.linkedin.com/in/directormiddleton	Work: Executive | Education: Masters | Family Office Role: CEO, Director, and fund manager | VC Experience: Actively investing and learning | Investing Capacity: >$5M | Authority: As part of a family office or similar structure | Interests: Economics, engineering, driving, food, the essence of the soul, freedom | Why Joining: To support the future architecture of finance and supply	other	\N	typeform	applied	Applied via Typeform on 2/8/2026, 5:09:22 PM\nPrefers: Email\nInterest: BlackRock. I have a deep respect for the company’s purpose. I have put time into understanding the development process of the organization and others similar and associated to the structure of global finance. I am a natural troubleshooter, searching for sources and reasons since a child. Economics and finance actually fascinate me to a depth that my mind almost intertwines with flows and systems, but seeing between lines and expressed boundaries. My father worked on the first super computer and taught me to read binary code. I come from a family that has a background in business management.\nNote: I aspire to be a future Architect.	[]	\N	f	\N	2026-02-08 17:09:24.05+00	2026-02-08 17:09:24.05+00
36608106-c99e-475a-8aa3-a20564d9e1fe	Qiao Zhou	zhouqiao.alpha@gmail.com	+1 5106315855	San Francisco	https://www.linkedin.com/in/qiao-zhou	Work: Quantitative research and portfolio management | Education: Masters in Financial Engineering, UC Berkeley | Family Office Role: Envisioning to setup my own family office in future as I accumulate my wealth. | VC Experience: Some exposure | Investing Capacity: $100K-1M | Authority: Independently | Interests: Hedge Fund, Investing, Venture, Technology | Why Joining: Investing in early stage venture and innovative startups, investing in VC, learn and grow alongside like-minded investment and technology professionals. Contribute to and give back to the community	other	\N	typeform	applied	Applied via Typeform on 2/8/2026, 5:35:03 PM\nPrefers: Email\nInterest: AI/Agentic economy: robotics and space exploration;	[]	\N	f	\N	2026-02-08 17:35:05.01+00	2026-02-08 17:35:05.01+00
ac06477a-d774-4d27-b9db-931051cfc054	Michael	michaelsgriff@yahoo.com	703-732-4422	Alexandria (near Washington, D.C.)	https://www.linkedin.com/in/michael-griffith-76a87b4a/	Work: Advance AI video analytics solutions to improve highway safety and operations | Education: Master's Degree in Statistics, Master's Degree in Transportation Engineering, and Bachelor's Degree in Business Management | Family Office Role: I have a LLC that I lead to transform global highway safety practices. | VC Experience: Actively investing and learning | Investing Capacity: $100K-1M | Authority: In consultation with family or advisors | Interests: Professional - Save lives on the nation's highways and streets, Personal - Biking, Hiking, Reading, Investing, and Learning New Stuff as I start to enter a retirement phase of my life | Why Joining: I want to learn about venture capital investments in terms of what are the pros doing to make sound investments. What's the due diligence that must be done. In the end, I want to be able to educate my adult children on venture capital investing.	other	\N	typeform	applied	Applied via Typeform on 2/8/2026, 5:40:45 PM\nPrefers: Text / WhatsApp\nInterest: AI is causing major disruption across many disciplines. It appears to be more disruptive than the jump from static webpages to social media. What companies survive the AI world?  Where is the smart capital going? What's the big risk everyone will miss? This will be a multi-decade capital cycle. What is the smart money avoiding now\nNote: I'm a very nice and funny guy!	[]	\N	f	\N	2026-02-08 17:40:46.742+00	2026-02-08 17:40:46.742+00
5de3c0b5-67c9-4bc1-a446-8abbdfd8f6a7	Olaf	hanseidbendiksen@gmail.com	6505755357	Campbell	https://www.linkedin.com/in/hanseidbendiksen/	Work: GTM Consulting & Fractional COO | Education: Master of Management | Family Office Role: Advisor, helping prepare for an upcoming generational transition | VC Experience: Actively investing and learning | Investing Capacity: $100K-1M | Authority: As part of a family office or similar structure | Interests: I have 3 kids (9, 7 and 5) that dictates my interests these days, I love listening to various financial podcasts, following the fintech and general tech scene here in the Bay area, as well as Europe. We like being active, at the beach, on our bikes or skiing down the slopes. | Why Joining: I'd love to learn more, be part of a community to share and collaborate to strengthen my own skills, and hopefully contribute with my skillset for the greater good.	other	\N	typeform	applied	Applied via Typeform on 2/8/2026, 6:54:53 PM\nPrefers: Text / WhatsApp\nInterest: Fintech and healthtech, with a focus on scalable ways to improve general health and eldercare in preparation for the growing demand and the limited supply of caregivers\nNote: I've done a few investments with AV so far, and enjoying the learning  so far.	[]	\N	f	\N	2026-02-08 18:54:55.469+00	2026-02-08 18:54:55.469+00
eeab93e7-d218-49ca-bc26-f4cc5684f251	Valentine	valentinechiwome@gmail.com	6504767494	Atlanta	https://www.linkedin.com/in/valentine-chiwome-6b227a55/	Work: I'm a Senior Software Engineer at Waymo, working on fleet management and mapping. | Education: I have BSc in Computer Science from Jacobs University, with specialization in AI and Robotics. | Family Office Role: Founder and leader. | VC Experience: Actively investing and learning | Investing Capacity: $100K-1M | Authority: Independently | Interests: I enjoy learning about technology from research papers to the business side. Besides that, I enjoy Physics, African literature, watching movies, fashion and great music. | Why Joining: With a decade of experience operating at the frontier of deep tech, I am now pivoting to capital allocation. I view Venture Capital as the ultimate synthesis of my core competencies: rigorous technical diligence, engineering first-principles, and strategic investment.	other	\N	typeform	applied	Applied via Typeform on 2/8/2026, 7:19:39 PM\nPrefers: Email\nInterest: We can't brute-force AGI with today's power grid. The energy costs of training frontier models are unsustainable. I’m deploying capital into the solutions that break this bottleneck: next-gen silicon, space-based energy, and smarter algorithms. We need to do more than just plug in more GPUs; we need to rewrite the energy equation entirely.\nNote: I love the diligence phase. It allows me to synthesize my love for hard science and strategy with my intuition for people. I treat every deal like a puzzle, and I genuinely enjoy the process of solving it.	[]	\N	f	\N	2026-02-08 19:19:40.921+00	2026-02-08 19:19:40.921+00
ac2ce0bc-740d-4584-9c51-0dbdc373601e	Kari	ardoriter@gmail.com	+1(412)880-8002	San Francisco Bay Area	https://linkedin.com/in/shahnkarishma	Work: Strategic Advisor for startup founders, Venture Partner in AI & Web3 VC firm, Product Lead at tech companies | Education: MS from Carnegie Mellon Uni, Computer Science grad | Family Office Role: Venture Partner, Advisor, Investor | VC Experience: Actively investing and learning | Investing Capacity: Not now, but soon | Authority: In consultation with family or advisors | Interests: Invest, Connect, Learn, Grow and Play | Why Joining: Prepare for making large venture deals, build diversified portfolio, learn from peers and experts, invest strategically, understand challenges and methods of creating a thematic fund.	other	\N	typeform	applied	Applied via Typeform on 2/8/2026, 7:47:38 PM\nPrefers: Email\nAttends: Startup pitch events, Social gathering\nCommunities: Founders and Investors nexus events\nInterest: Agentic Commerce - Having worked deeply into AI & Blockchain space, I think this emerging trend synergizing both will supercharge the next trillion dollar commerce via new payment rails, monetization models, compute infra and autonomous multi-agent systems.\nNote: I also like value investing with social impact	[]	\N	f	\N	2026-02-08 19:47:39.602+00	2026-02-08 19:47:39.602+00
4cfc4faf-06e6-4800-8eb0-64c1d9ec5acb	Theron	twalsh17tenor@gmail.com	3174601624	Indianapolis	http://linkedin.com/in/theron-walsh-5a5809221	Work: BIolife Solutions | Education: Purdue University BS Biochemistry | Family Office Role: I’ve been provided a relatively small fund ($1m) to invest in areas of expertise to prepare for a broader role as my father retires. | VC Experience: Early learner | Investing Capacity: $100K-1M | Authority: Independently | Interests: I love science, investing in biotech, life sciences and energy, ice hockey, pro basketball, | Why Joining: I have a deep interest in investing and being a good steward of my family’s money. My educational background and interests are decidedly nerdy and scientific. I work in CRISPR related cell and gene therapies and have invested in biotech, life sciences, and energy (primarily nuclear). I have no business or finance training and feel it’s a blind spot as I evaluate investment proposal.\nI’m highly analytical and strong at math and think I will excel at financial modeling but have little exposure to date. My father is a CEO, former public company CFO and CPA and has tried to teach my brother and me the nuances of EBITDA multiples, free cash flow, and importance of growth rates and margins but I would enjoy the opportunity to out these lessons into practice.	other	\N	typeform	applied	Applied via Typeform on 2/8/2026, 7:52:57 PM\nPrefers: Email\nInterest: use of gene therapy and  CRISPR for\nTargeted therapies, small nuclear power developments, ai driven adtech/martech\nNote: I don’t think so	[]	\N	f	\N	2026-02-08 19:52:58.463+00	2026-02-08 19:52:58.463+00
3a016b6e-e9f9-454f-86b1-b2cb112dee97	Srini	sriniraghavan@gmail.com	4257704744	Seattle	https://www.linkedin.com/in/srini-raghavan	Work: Corporate Vice President of Copilot & Agents at Microsoft | Education: Bachelor’s in EC Engineering & MBA Finance & Marketing | Family Office Role: Principal | VC Experience: Some exposure | Investing Capacity: $100K-1M | Authority: Independently | Interests: Tech, Business, Investing, Startups | Why Joining: Learn about venture capital & build game-changing businesses	other	\N	typeform	applied	Applied via Typeform on 2/8/2026, 7:55:51 PM\nPrefers: Email\nInterest: One trend I find genuinely compelling right now is AI agents evolving from copilots into durable economic actors.\n\nWhat matters most isn’t the model layer, it’s rapidly commoditizing—but the infrastructure around agents: orchestration, permissions, memory, and governance. The biggest unsolved problem I’m watching is persistent memory and context portability. Today, most agents are stateless or locked into single platforms. The next breakout companies will enable agents to retain long-lived memory across tools and vendors, while giving users and enterprises control over privacy, auditability, and trust.\n\nIn enterprise settings, this is especially critical. Agents touch calendars, documents, CRM, financial workflows, and identity systems. The winners won’t be flashy demos; they’ll solve the “boring but essential” problems—authorization models, human-in-the-loop escalation, and cost governance at scale.\n\nFrom an investing lens, this creates room for defensible platforms, not features. We’re moving from copilots → task agents → multi-agent systems → agent ecosystems. Startups building the control plane for agents—memory layers, orchestration frameworks, and governance primitives—feel analogous to early cloud infrastructure: subtle at first, inevitable in hindsight.\nNote: I come to venture investing first as an operator and ecosystem builder, not a financial engineer. I’ve spent decades building platforms at the biggest company, working with some of the most brilliant engineers and scaled to hundreds of millions of users at Microsoft; also working with startups at every stage, and watching where theory breaks when products hit real customers and real organizations.\n\nI’m particularly interested in being a thoughtful, long-term partner to founders—helping with product clarity, go-to-market discipline, and navigating enterprise complexity—rather than just capital allocation. I tend to have strong pattern recognition around platforms, developer ecosystems, and second-order effects (where value accrues after the initial use case works).\n\nI’m also intentionally exploring venture as a family and legacy activity, involving my children to build judgment, ethics, and long-term thinking around technology and capital. That lens makes me patient, selective, and deeply focused on companies that create durable value—not just fast exits.\n\nFinally, I’m excited to learn. I’m opinionated, but not precious about my views, and I value cohorts like this as a way to sharpen judgment, compare mental models, and get better alongside other serious investors.	[]	\N	f	\N	2026-02-08 19:55:51.685+00	2026-02-08 19:55:51.685+00
743e0751-9d4c-42e1-bb6e-2089b9aa5ac2	Ariel	arielbs10@gmail.com	2068162042	Seattle, WA	https://www.linkedin.com/in/ariel-ben-sasson/	Work: Founder in biotech space | Education: PhD in nano-science and nano-technology, electrical engineering. In addition about 7 years as a research fellow in ML protein design (2024 chemistry Nobel Prize lab) | Family Office Role: Founder and CTO --> maybe soon new founder and CEO | VC Experience: Some exposure | Investing Capacity: Not now, but soon | Authority: Independently | Interests: Materials, biomaterials, computers, robotics, brain-computer interfaces. | Why Joining: Understanding fundraising and value creation is as core capabilities of a founder, no less than the science/technology he is a champion in.	other	\N	typeform	applied	Applied via Typeform on 2/8/2026, 11:04:56 PM\nPrefers: Text / WhatsApp\nInterest: AI, AI infra, robotics, Quantum computing, Biotech\nNote: Experienced founder and scientist able to understand core tech value innovation across domains, many of the more recently important domains.	[]	\N	f	\N	2026-02-08 23:04:57.622+00	2026-02-08 23:04:57.622+00
d0151bf8-0115-4474-a591-cd97ef9ed714	Greg	greg@gregstuart.com	6317020682	Brooklyn, NY	https://www.linkedin.com/in/gregstuart/	Work: CEO of $25M business. Former Venture Partner. Was an Angle investor. | Education: Undergrad. Economics. | Family Office Role: I am not a family office. | VC Experience: Experienced, looking to deepen pattern recognition | Investing Capacity: $100K-1M | Authority: Independently | Interests: I work a lot. But because I acheive legacy. | Why Joining: I don't have time to angel invest myself any longer.	other	\N	typeform	applied	Applied via Typeform on 2/9/2026, 1:14:57 AM\nPrefers: Email\nInterest: AI. AI. AI.  Then Quantum. And Robotics.\nNote: I need to know more about this to know if I can do and should do. Can my kid sit in with me, so they learn too?	[]	\N	f	\N	2026-02-09 01:14:58.855+00	2026-02-09 01:14:58.855+00
9386ef89-eb74-410d-b26b-7cc58b1d3e5e	Vijay	aluruvk@hotmail.com	4698889904	Dallas	https://www.linkedin.com/in/vijayaluru/	Work: Consulting | Education: MBA | Family Office Role: Investment analysis and investing. | VC Experience: Actively investing and learning | Investing Capacity: $100K-1M | Authority: Independently | Interests: Know about companies, reading, analyzing & investing | Why Joining: I’m interested in this club because it aligns with the disciplined investment practice I’m building at Instinctive Ventures. I’ve spent years operating and investing independently, and I’m now building a more disciplined, scalable investment practice. What I’m missing and what this cohort uniquely offers is a community of thoughtful investors who are actively evaluating opportunities together, challenging each other’s assumptions, and learning by doing rather than by theory.\nI can also contribute meaningfully: I bring 30 years of finance, compliance, and operational rigor, along with a structured approach to evaluating markets, teams, and execution risk. I enjoy collaborative debate, and I’m comfortable pressure testing assumptions, synthesizing data, and helping refine investment frameworks.	other	\N	typeform	applied	Applied via Typeform on 2/9/2026, 1:26:00 AM\nPrefers: Email\nInterest: Currently through my company INSTINCTIVE VENTURES MASTER LLC, using Series LLC’s I am raising capital from accredited investors to invest in two companies – Atombeam & Etherdyne Technologies.\nSeries AB-I Atombeam - This startup has developed a breakthrough technology that delivers 4 times more compaction than industry standards, enabling real time transmission of tiny machine messages that were previously impossible to compress. This reduces the GPU usage.  \nSERIES ET-I Etherdyne - ETI's technology allows for innovative designs free from batteries and power cords, making devices lighter, more flexible, and perpetually powered. ETI uses magnetic energy to safely deliver power through-the-air, creating desk and even room-sized wire-free power zones. Cordless & batteryless is the future.\nNote: More details in person. Eagerly awaiting to become part of the team.	[]	\N	f	\N	2026-02-09 01:26:02.199+00	2026-02-09 01:26:02.199+00
220864cc-585b-4263-8a82-f1946f2f0bd1	Rene	rene.chaze@TinyOrangeCapital.com	+1 202-441-2018	McLean, VA (Washington, DC area)	https://www.linkedin.com/in/rene-chaze/	Work: I lead a family office team | Education: BS (accounting); Masters (taxation law); MBA (Wharton) | Family Office Role: I lead all investment sourcing and evaluation work, I chair the investment committee with two of the family principals in making deployment decisions, plus many other family office management responsibilities. | VC Experience: Experienced, looking to deepen pattern recognition | Investing Capacity: $1M-$3M | Authority: Independently | Interests: family time; global travel; learning new things; European soccer | Why Joining: Wonderful opportunity to join a cohort of great people, participate in stimulating evaluations and conversations, be part of a community of like-minded peers, learn new things and share some of my own experiences in how our family office makes assessments and decisions.	other	\N	typeform	applied	Applied via Typeform on 2/9/2026, 4:36:58 AM\nPrefers: Email\nAttends: McDermott Will & Emery annual family office summit; Institute of Private Investors; several small private family office working groups closed to outsiders, others\nCommunities: Small groups of other family office professionals who gather in DC or NYC to discuss issues and investment opportunities.\nInterest: Of course, AI.  But so too is everyone.  However, I'm looking beyond the participants that are capturing most of the interest in the news.  Rather, I'm interested in traditional industries/companies that will utilize AI to radically decimate their cost structure and create enormous shareholder value.\nNote: I've admired AV's business model and creativity for years (I'm also an investor in AVG and a few funds and syndications).  I applaud you all for assembling this group -- not only because I'd love to be a member, but it is a very smart business development channel.  I believe I would add the right balance of listening and sharing as a member of this group.  Thanks much!	[]	\N	f	\N	2026-02-09 04:36:59.648+00	2026-02-09 04:36:59.648+00
f327c630-373a-43db-9ee3-144b10d53823	Veeresha	vjavli@gmail.com	1-650-773-7711	Pleasanton	www.linkedin.com/in/vjavli	Work: Manage and build Enterprise Applications at Meta | Education: MBA (Global Business Americas), UCLA Anderson; MS (Software Systems), BITS Pilani, India; BE (Computer Sciences and Engineering) , Bangalore University, India | Family Office Role: CTO (Understand the problem with clarity, Explore solutions,  innovate products and services for the markets) | VC Experience: Early learner | Investing Capacity: $100K-1M | Authority: Independently | Interests: Innovations; Problem Solving; Build new products and services; Build healthy and vibrant community as community leader | Why Joining: To gain experience from the seasoned VCs.  To proactively help VCs	other	\N	typeform	applied	Applied via Typeform on 2/9/2026, 6:59:25 AM\nPrefers: Email\nInterest: Technologies - Quantum Computing, AI/ML design and build with minimal code; Immuno Therapy drugs, AI Chip Design, AI Data Centers, Autonomous vehicles; Explore space\nNote: Received 4 US patents in Cost Management at Oracle USA Inc	[]	\N	f	\N	2026-02-09 06:59:26.938+00	2026-02-09 06:59:26.938+00
1f1fca37-ade1-48a6-a3f1-cc88e0af5250	Eugene	eugenelee@talgroup.com	+852-9176-4943	Hong Kong	https://www.linkedin.com/in/eugene-lee-48074b156/	Work: I work for TAL Apparel Ltd, a garment manufacturing company. Currently, I am the Managing Director of Corporate Venture Investment within the family office | Education: Bachelor's and Master's of Mechanical Engineering from MIT; MBA from the Darden School of Business at the University of Virginia | Family Office Role: Currently, my role is Managing Director of Corporate Venture Investment. We look for startups that have technology which can help move our industry forward. Therefore, our investment objectives have a balance of financial and strategic purpose. Being a 3rd generation family member, I am also looking at our overall family office investment allocation and exploring how private markets investment can help improve returns and diversification. Today, investment allocation and large investment decisions are still made by my uncle, the Honorary Chairman. However, eventually, it will be the role of my cousin, the Vice Chair, and myself to made those investment decisions. I am also a board member of TAL Apparel which oversees the apparel manufacturing business | VC Experience: Actively investing and learning | Investing Capacity: $100K-1M | Authority: In consultation with family or advisors | Interests: Regarding my CVC work, I'm interested in the areas of climate and deep tech; especially any enabling technology that can help reduce waste/inefficiency and create a better product within the apparel industry. I am also interested in learning more about private market investing in order to further optimize our family office investment allocation. Personally, I love sports - both watching (NFL, NBA, golf, tennis, etc.) and playing (golf, tennis) | Why Joining: For my over 20 years at TAL Apparel, I spent 20 managing factories in China and Vietnam and sales/merchandising teams in Hong Kong. Only 1.5 years ago, I moved over the family office to learn the investment part of the business. We first focused on fund investment and through those funds have built up a strong pipeline of startup companies we're interested in investing in and/or commercially partnering with. I'd like to sharpen my skills in choosing which of these startups to invest in	other	\N	typeform	applied	Applied via Typeform on 2/9/2026, 11:33:42 AM\nPrefers: Email\nInterest: Next-gen materials that can create textiles which have better price/performance than current fibers and be more sustainable. Clothing today relies heavily on petro-derived fibers like polyester. These fibers do not decompose and they also shed microfibers which are harmful to us. And even natural fibers like cotton use up lots of valuable resources. One specific trend I find interesting is companies being able to create new fibers from waste (agricultural waste, protein waste, food processing waste etc.). One specific company I like is Everbloom (https://www.everbloom.bio/) - they can take waste chicken feathers and turn them into wool/cashmere-like fibers. Those fibers look and feel like wool, but they also have performance properties which are better than wool. So if blended together with wool/cashmere, it can create a fabric that still feels luxurious but is also more durable and can be machine washable!\nNote: My 20 years operating a business in the apparel manufacturing industry gives me a great instinct/feel for what new technologies can be successful in our industry. But while my perspective may be very deep, I recognize how narrow it can be. So I very much value being able to evaluate deals together with people from all different backgrounds and experiences. As I'm still learning as an investor, I hope that joining this cohort will help me realize some of the blindspots I have today.	[]	\N	f	\N	2026-02-09 11:33:43.7+00	2026-02-09 11:33:43.7+00
976963f9-3d63-4d27-ab2d-6ffae98850e0	Andrew	andrew.boral@gmail.com	2125818369	New York City	https://www.linkedin.com/in/andrew-b-62b9021/	Work: Insurance Actuary for Variable Annuity Hedging | Education: MIT Economic BS, NYU Economics MA, ASA, CFA | Family Office Role: Portfolio Manager | VC Experience: Experienced, looking to deepen pattern recognition | Investing Capacity: $100K-1M | Authority: Independently | Interests: AI, Finance, Technology, and Sports | Why Joining: To gain a better understanding of the performance of my VC investments	other	\N	typeform	applied	Applied via Typeform on 2/9/2026, 11:54:41 AM\nPrefers: Email\nAttends: CFA Institute Events, CQF Events, and Society of Actuary Events.\nInterest: Space, Robotics, and AI.  The pace of innovation is accelerating due to AI and autonomy.  The cost and ability to travel to space is becoming dramatically more accessible.  With SpaceX's and Boeing's push to travel to the moon and mars, there will be numerous investment opportunities.  Robotics and AI will facilitate better production methods and tackling the technical challenges.\nNote: I am passionate about investing with decades of experience.  While I initially started investing in the public markets, I have been investing in venture capital for over a decade.  There have been some successes in venture capital investing in my portfolio, yet I am determined to improve my knowledge and will make disciplined investment.  \n\nInvesting in venture capital is not a solitary endeavor.  Venture capital investing needs to be done as part of a team and is inherently social.	[]	\N	f	\N	2026-02-09 11:54:42.357+00	2026-02-09 11:54:42.357+00
7002f7cf-1735-4606-922a-1fea28dd0729	JP	jpark641@gmail.com	6467713225	New York	https://www.linkedin.com/in/jiwooparkcfa	Work: Family office - Private equity investments | Education: Duke University (BSc); Columbia Business School (MBA) | Family Office Role: Managing Director - Investments | VC Experience: Experienced, looking to deepen pattern recognition | Investing Capacity: $1M-$3M | Authority: Independently | Interests: VC investing | Why Joining: Want to learn more about investing through AV and connect with other family office professionals	other	\N	typeform	applied	Applied via Typeform on 2/9/2026, 2:54:23 PM\nPrefers: Email\nAttends: Co-investments focused events; family office events organized by banks and advisors\nCommunities: Bespoke group of family offices; another group of family offices connected to GIC\nInterest: LLM and vibe coding, quantum computing, space infrastructure\nNote: Have been in VC world (co-investments and fund investments) since 2012	[]	\N	f	\N	2026-02-09 14:54:24.662+00	2026-02-09 14:54:24.662+00
34632a6c-ce52-40ce-a204-777b6ebf7b25	Allison Wu	allison@terramindsai.com	8583499122	San Diego	https://www.linkedin.com/in/allisoncywu/	Work: AI consultant for biotech | Education: UCSD PhD, National Taiwan University BS | Family Office Role: Consultant/ AI tech lead | VC Experience: Early learner | Investing Capacity: $100K-1M | Authority: Independently | Interests: AI, data science, biotech, deep tech, healthcare | Why Joining: Learning more about analyzing deals	other	\N	typeform	applied	Applied via Typeform on 2/9/2026, 5:29:59 PM\nPrefers: Email\nInterest: Synthetic biology like leveraging microbes for mining etc / AI in biotech research development	[]	\N	f	\N	2026-02-09 17:30:01.402+00	2026-02-09 17:30:01.402+00
15e42262-e286-4b70-96b4-cff898354ba1	Brent	brent.cutcliffe@gmail.com	7203141236	Denver	https://www.linkedin.com/in/brentcutcliffe	Work: Co-founder of chemical startup | Education: MBA | Family Office Role: COO | VC Experience: Some exposure | Investing Capacity: $100K-1M | Authority: Independently | Interests: Private market investing, tennis | Why Joining: Expand investment knowledge.	other	\N	typeform	applied	Applied via Typeform on 2/9/2026, 5:55:08 PM\nPrefers: Text / WhatsApp\nInterest: AI - it will dramatically change the world.	[]	\N	f	\N	2026-02-09 17:55:09.728+00	2026-02-09 17:55:09.728+00
0085244a-ad02-4878-95f9-b04a9e15e58c	Kapil	kapilbareja@gmail.com	+1 703-439-9853	Livingston	https://www.linkedin.com/in/kapilbareja	Work: CyberRisk Leader working for Deloitte | Education: Masters in Computer Science | Family Office Role: I influence critical business decisions for my organization. | VC Experience: Early learner | Investing Capacity: $100K-1M | Authority: In consultation with family or advisors | Interests: Continuous learning, mentorship, traveling, Fitness | Why Joining: Joining the AV Next-Gen Venture Club presents an exciting opportunity to engage directly with real venture work, offering hands-on experience in market evaluation and due diligence. By learning from seasoned investors and engaging with peers facing similar challenges, I can enhance my expertise in capital allocation and make a meaningful impact within my family office.	other	\N	typeform	applied	Applied via Typeform on 2/9/2026, 9:18:45 PM\nPrefers: Email\nInterest: AI, Technology, Cyber. Quantum, IOT/OT, climate	[]	\N	f	\N	2026-02-09 21:18:46.584+00	2026-02-09 21:18:46.584+00
09d94c77-87ec-4086-95d9-0b93611b86be	Avi	aviganti1@gmail.com	8583528699	San Diego	https://www.linkedin.com/in/aviganti	Work: Investment Analyst/Venture Capital Fellow | Education: Pepperdine B.S., Columbia Business School Executive Education | Family Office Role: Investment Analyst | VC Experience: Actively investing and learning | Investing Capacity: $100K-1M | Authority: In consultation with family or advisors | Interests: Endurance sports(currently training for an Ironman), Vintage Cars | Why Joining: Helps me to intentionally build toward long term stewardship, investment judgment, and disciplined exposure to venture as an asset class.	other	\N	typeform	applied	Applied via Typeform on 2/9/2026, 9:34:19 PM\nPrefers: Email\nAttends: Young President's Organization UHNWI\nCommunities: Decile Group Palo Alto\nInterest: -Biotech/Healthcare showing renewed VC momentum -Liquidity and exit dynamics of venture are shifting\n-VC investment horizon is extending, capital concentration\n-Larger rounds, evolving raise patterns	[]	\N	f	\N	2026-02-09 21:34:20.318+00	2026-02-09 21:34:20.318+00
e3a42ee3-852f-4567-bbb2-86c4f9d9746d	Richard	richardincyberspace@gmail.com	2149096833	Dallas, TX	https://www.linkedin.com/in/richardwang-ai/	Work: Implement AI | Education: BA and MS in Computer Science | Family Office Role: Principal | VC Experience: Experienced, looking to deepen pattern recognition | Investing Capacity: $1M-$3M | Authority: In consultation with family or advisors | Interests: Professional: AI;  Personal: Volunteering for Youth Robotics | Why Joining: Learn about investment opportunities	other	\N	typeform	applied	Applied via Typeform on 2/9/2026, 9:36:46 PM\nPrefers: Email\nAttends: NA\nInterest: AI - this is the field I know the best	[]	\N	f	\N	2026-02-09 21:36:47.35+00	2026-02-09 21:36:47.35+00
8dff1d80-cd18-4470-81de-1ee27cb6d9af	Sunil	skbhasin1@gmail.com	408-910-6677	San Jose	https://www.linkedin.com/in/sunil-bhasin-081b09/	Work: In between jobs right now, last role was in Engineering Management at Google LLC | Education: MBA  UC Berkeley and Bachelors in Electrical Engineering, IIIT KGP | Family Office Role: Head of the family office/household | VC Experience: Some exposure | Investing Capacity: $100K-1M | Authority: In consultation with family or advisors | Interests: High Tech Investments | Why Joining: Learning more about the Venture Process and Investing alongside	other	\N	typeform	applied	Applied via Typeform on 2/10/2026, 12:17:41 AM\nPrefers: Email\nInterest: Physical Robotics - it is the next big thing that shapes all our lives\nNote: NA	[]	\N	f	\N	2026-02-10 00:17:43.027+00	2026-02-10 00:17:43.027+00
1bd1e054-752e-4aa6-8144-b5184955f93d	Rahul	rahuls0720@gmail.com	713-501-0621	Memphis	https://www.linkedin.com/in/rahuls0720/	Work: Security Engineer | Education: Bachelors and Masters in Computer Engineering/Cybersecurity | Family Office Role: I exclusively manage both my money and my parents money. | VC Experience: Actively investing and learning | Investing Capacity: $100K-1M | Authority: Independently | Interests: Tech, finance, & sports | Why Joining: I've done well in the stock market over the past 9 years. I'd like to take my investing to the next level.	other	\N	typeform	applied	Applied via Typeform on 2/10/2026, 1:29:52 AM\nPrefers: Email\nInterest: Cloud and related technologies - memory, GPUs, AI algo, etc. This space is growing incredibly fast with high margins and I understand it very well.	[]	\N	f	\N	2026-02-10 01:29:54.282+00	2026-02-10 01:29:54.282+00
a4572c49-c304-403e-9b9d-e35d59be8e08	Bekah	bekahagwunobi@gmail.com	2038155631	San Francisco	linkedin.com/bekahagwunobi	Work: Rotational PM at Meta (WhatsApp AI) | Education: B.A. Columbia University CS | Family Office Role: I have supported my parent’s business through social media/content creation and defining product specifications. | VC Experience: Early learner | Investing Capacity: Not now, but soon | Authority: In consultation with family or advisors | Interests: Running, Aerial, Startups, Personal Finance, Social Media/Creator Economy | Why Joining: I haven’t had a lot of exposure to startups through work, since Meta’s products are all mature. I think this would be an amazing opportunity to learn from peers and professionals. I’m excited to connect with others that share an interest for venture.	other	\N	typeform	applied	Applied via Typeform on 2/10/2026, 5:08:32 AM\nPrefers: Text / WhatsApp\nInterest: I think personal assistant technology that allows people to automate every aspect of daily life, like open claw, and group/social AI experiences are the future of how people will interact with agents. I think AI will win in use cases where it’s able to give people real time back to spend with their loved ones or on deep focus work. I also think it will become a fundamental part of how we connect with friends and family in the future. I think this is reflected in how the use cases of AI have expanded dramatically from isolated search type queries to anything from therapy to social sharing.\nNote: Thank you for your time!	[]	\N	f	\N	2026-02-10 05:08:33.638+00	2026-02-10 05:08:33.638+00
177c56ac-9d4b-43d8-9826-8b72a33c78de	EDoyle	ELAINE.KIELY@ME.COM	2062473586	Seattle	Elaine-Doyle-kiely	Work: Autharva | Education: Bachelors Degree in Information Technology. Associate Degree in Accounting & Finance , MBA in Technology Management & Leadership (UW Washington) | Family Office Role: Co-founder | VC Experience: Actively investing and learning | Investing Capacity: $100K-1M | Authority: In consultation with family or advisors | Interests: Stock Market, Finance, Politics, AI, Sports | Why Joining: I’m European by birth (Ireland) yet I live in the US. I believe therefore I have broad thoughts on finance, the environment, culture, ethics, clean energy, social justice, and in addition I have  10+ years experience working at multiple leadership levels for American big tech (Salesforce) where I learned the forces of capital and economical structure. I’ve learned to be scrappy, to  build  progress step by step and know first hand how venture capital influence can transform company culture.\nNow that I’m a co-founder myself I understand the wisdom that comes with years (25+) of experience in an industry, mine is Security Engineering. Bring on the next 10 years where I com help influence the next gen of founders and entrepreneurs and when better if I can ensure I help more women rise to the challenge!	other	\N	typeform	applied	Applied via Typeform on 2/10/2026, 6:55:34 AM\nPrefers: Text / WhatsApp\nInterest: Hydrosat - a satellite company that uses thermal infrared imagery and AI to monitor water, crops, and land surface conditions. \n\nI was born on a farm and I believe drought and flood management are key technologies our kids need to specialize in. These jobs will replace the next ‘data science’ phenomena's.\n\nHydrosat focus on improving agricultural productivity, water management, crop water stress, irrigation needs, and water productivity.\nNote: Nah. I’m just an ordinary person with extraordinary views.	[]	\N	f	\N	2026-02-10 06:55:36.047+00	2026-02-10 06:55:36.047+00
3b275138-94d3-429e-b8a0-6b7cb9e946e2	RBIG	wealthvenue@gmail.com	+12023503311	PARIS	https://www.linkedin.com/in/rb-wealthvenue/	Work: Compliance Officer, Founder, Investment Analyst, Data Scientist | Education: Stetson University, Bachelor’s Degree, Finance and Financial Management Services | Family Office Role: Investor | VC Experience: Actively investing and learning | Investing Capacity: $100K-1M | Authority: In consultation with family or advisors | Interests: Programming, Investment, Trekking | Why Joining: Becoming a better investor in private deals, meeting VCs and Founders, Learn with different angles	other	\N	typeform	applied	Applied via Typeform on 2/10/2026, 4:23:57 PM\nPrefers: Text / WhatsApp\nInterest: ORBES, SpaceTech, the next frontier for Globalization\nNote: Looking forward to try this	[]	\N	f	\N	2026-02-10 16:23:58.959+00	2026-02-10 16:23:58.959+00
45f155b9-398d-4b6e-b95c-beb29109a181	Lee	lgrzesh@gmail.com	9175667762	New York	www.linkedin.com/in/leegrzesh	Work: CFO/Partner of Venture Fund and Family Office | Education: Undergraduate business degree, MBA | Family Office Role: CFO | VC Experience: Experienced, looking to deepen pattern recognition | Investing Capacity: Not now, but soon | Authority: As part of a family office or similar structure | Interests: Memorabilia collecting, venture investment, wine/scotch collecting | Why Joining: I think I could learn a lot and also share my experiences in order to be a better partner/CFO at my firms.	other	\N	typeform	applied	Applied via Typeform on 2/10/2026, 5:38:33 PM\nPrefers: Text / WhatsApp	[]	\N	f	\N	2026-02-10 17:38:35.056+00	2026-02-10 17:38:35.056+00
53235552-f554-4656-8bf3-21aea499f052	Roy	royashok@outlook.com	+18584371751	San Diego, CA	https://www.linkedin.com/in/royashok/	Work: Campfire 3D, Inc. | Education: BS, MS in Electrical & Computer Engineering. MBA | Family Office Role: I currently angel invest and I want to formalize this into a family office. I'm also the co-founder and COO of Campfire - an early stage startup disrupting product engineering and manufacturing with VR and AI. | VC Experience: Actively investing and learning | Investing Capacity: $100K-1M | Authority: Independently | Interests: Commercializing deep-tech. I've worked to make early stage tech into real products and along the way define markets. Advise startups across tech and medical devices | Why Joining: Preparing to launch my own family office in the next 5 years and grow it with the next generation. Meet and network with a diverse set of people with similar goals and interests in VC.	other	\N	typeform	applied	Applied via Typeform on 2/11/2026, 3:27:45 AM\nPrefers: Text / WhatsApp\nInterest: Entire- Thomas Dohmke's startup is perhaps the first one that very thoughtfully looks how a human developer can use AI in a very effective way. \nToday every investor I talk to looking to invest in AI asks what the labor replacement savings are. That to me is just scratching the surface and is more herd mentality than anything else. Humans are not going anywhere. The real questions are:\n1. What companies are going to transition a any worker into a knowledge and skills powerhouse?\n2. What new trends, behaviours (social, professional) does this superhuman worker bring to society?\n3. What are the new ecosystems that will build and sustain this worker ?\n\nMy startup, Campfire (https://campfire3d.com) is all about AI in human centric-processes specifically to enhance product engineers, manufacturing engineers, assemblers, service techs, trainers, sales and others downstream. These are the next wave of startups in AI.	[]	\N	f	\N	2026-02-11 03:27:47.082+00	2026-02-11 03:27:47.082+00
4aa3bd94-97a0-42d7-addb-9d0b7172f72a	Arick	wong.arick@gmail.com	14232902351	Oakland	https://www.linkedin.com/in/arick-wong-ba958934	Work: Clinical Development for Pharmaceuticals | Education: Bachelor's in Neuroscience from Vassar | Family Office Role: Operations | VC Experience: Early learner | Investing Capacity: $100K-1M | Authority: Independently | Interests: Renewable energy, healthtec/medtech, agentic AI | Why Joining: Connecting with likeminded investors!	other	\N	typeform	applied	Applied via Typeform on 2/11/2026, 4:54:03 PM\nPrefers: Text / WhatsApp\nInterest: Using energy sources from space	[]	\N	f	\N	2026-02-11 16:54:04.979+00	2026-02-11 16:54:04.979+00
16e33ec6-164d-4e02-a301-9eaa8462267a	Keith	paluk@protonmail.com	646.872.6751	San Diego	https://www.linkedin.com/in/keith-palumbo-7b997930?utm_source=share_via&utm_content=profile&utm_medium=member_android	Work: Consulting for HNI's | Education: JD/serial founder | Family Office Role: Advisor | VC Experience: Actively investing and learning | Investing Capacity: $100K-1M | Authority: In consultation with family or advisors | Interests: Building, investing, AI/Security | Why Joining: Working in adjacent space, looking to learn more about formal investment approaches	other	\N	typeform	applied	Applied via Typeform on 2/11/2026, 8:55:26 PM\nPrefers: Email\nInterest: Over rotation on agentic AI in security and concomitant disconnect between Seed/A rounds and anything resembling ARR	[]	\N	f	\N	2026-02-11 20:55:27.631+00	2026-02-11 20:55:27.631+00
0926ed6f-f4bd-41fa-b470-5a253aba8692	Ariel	arielcai007@gmail.com	341-400-7309	Palo Alto	https://www.linkedin.com/in/cariel/	Work: Electronic Arts | Education: Stanford GSB | Family Office Role: product | VC Experience: Experienced, looking to deepen pattern recognition | Investing Capacity: Not now, but soon | Authority: Independently | Interests: Building human-centered AI products; responsible AI adoption; early-stage investing and supporting founders; creator tools and consumer experiences; global tech and culture. | Why Joining: learn by doing with real investment decisions; small trusted cohort	other	\N	typeform	applied	Applied via Typeform on 2/12/2026, 5:29:28 AM\nPrefers: Email\nInterest: I’m genuinely interested in AI coding tools and “creative copilots” because they’re turning ideas into prototypes dramatically faster, expanding what small teams can create.	[]	\N	f	\N	2026-02-12 05:29:30.337+00	2026-02-12 05:29:30.337+00
4ad2b127-fb0d-4213-a502-26b695aba9b1	Eli	eli22harrison@gmail.com	2402244254	Bethesda	https://www.linkedin.com/in/eliharrison/	Work: I’m an Entrepreneur-in-Residence at a bioaccelerator, where I work closely with early- and mid-stage life science companies on strategy, commercialization, and scaling. I spend a lot of time with founders and scientific teams helping turn technical breakthroughs into fundable companies. Outside of that, I’ve also helped build ventures across biotech, tech, and consumer sectors, mostly around company formation and early execution. | Education: UPENN B.A. Biochemistry & Chinese (Mandarin) - UVA M.S. Commerce Biotechnology & Finance | Family Office Role: I’m involved in the investment process, contributing to diligence and helping inform decisions, especially through on-the-ground evaluation of opportunities. After we invest, I stay engaged with companies where useful, supporting follow-through and looking for ways we can help them grow and capture more value. I also spend time sourcing new opportunities as we look to expand and diversify into areas where there are clear high-value gaps. | VC Experience: Actively investing and learning | Investing Capacity: $100K-1M | Authority: In consultation with family or advisors | Interests: I’m generally interested in how frontier science and new technologies actually make their way into the real world. I pay a lot of attention to what drives adoption — market dynamics, design, culture, and behavior — not just the tech itself. I like learning from people building in different sectors and places, and comparing how different fields think about innovation, risk, and scaling. | Why Joining: I’m interested in joining because it builds on work I’m already doing — looking at early-stage companies and making real investment decisions. What appeals to me is the structure and the peer group: regularly reviewing strong deals, pressure-testing assumptions, and writing clear invest/pass rationales with others who are stepping into similar capital allocation roles. I’m looking to keep sharpening my judgment through repetition and shared perspective, and to learn how other investors think about risk, conviction, and portfolio building, while bringing my own operator and technical background into the mix.	other	\N	typeform	applied	Applied via Typeform on 2/13/2026, 3:40:25 AM\nPrefers: Email\nInterest: DNA Origami for drug delivery feels like something straight out of sci-fi, which is part of why I find it so interesting. The idea that we can fold DNA into tiny, programmable structures that move through the body carrying drugs reminds me of the kind of microscopic machines imagined in Fantastic Voyage or the medical nanotech you’d see in Star Trek — except now it’s happening with real molecular engineering.\n\nWhat’s compelling is the level of control. With DNA origami, you can arrange payloads and targeting elements with nanometer precision, basically turning biology into a programmable delivery platform. This creates design possibilities that go way beyond traditional drug carriers.	[]	\N	f	\N	2026-02-13 03:40:27.551+00	2026-02-13 03:40:27.551+00
ccc8f10e-4d33-408e-bcd4-e9917ac25dc7	Pinaki	pinaki@utexas.edu	5125772170	Austin	https://www.linkedin.com/in/pinaghosh/	Work: Self Employed | Education: Graduate degree in Systems Engineering | Family Office Role: Manage funding and do due diligence | VC Experience: Early learner | Investing Capacity: $100K-1M | Authority: Independently | Interests: Energy Conservation, RV parks, tiny houses | Why Joining: I want to understand VC investing and contribute with my knowledge and skills	other	\N	typeform	applied	Applied via Typeform on 2/13/2026, 3:29:11 PM\nPrefers: Email\nInterest: Energy Management\nNote: no	[]	\N	f	\N	2026-02-13 15:29:13.491+00	2026-02-13 15:29:13.491+00
cda8ae2e-f684-47ec-a2b0-524767ec85a0	August	august.bress@gmail.com	3073997832	Salt Lake City	https://www.linkedin.com/in/august-bress-7222b7351/	Work: I work for LeafPlanner, financial planning/family office software provider. I also do consulting work for my family office helping with NextGen engagement and our current transition to a PTC structure | Education: BA in Government from Claremont McKenna College, BS in Archaeology from the University of Utah, CFP certificate from NYU, currently pursuing MBA at NYU Stern | Family Office Role: I serve on my family office advisory board and represent my family as part of several family office peer groups. I am an involved beneficial shareholder in my family business, and I recently completed an long-term visioning project along with a cohort of my cousins defining where we would like too see the companies in the next fifteen years. | VC Experience: Some exposure | Investing Capacity: $100K-1M | Authority: Independently | Interests: Skiing, swimming, gardening, reading, cars/motor racing, family business and governance | Why Joining: I am a sixth-generation member of my family office, and over the past few years I have been intentionally building the skills necessary to contribute meaningfully to its long-term stewardship.\n\nOn the qualitative side, I have held leadership roles on our Family Council and Family Office Advisory Board, where I’ve gained experience in governance, intergenerational communication, and aligning capital with family values. I have also represented my family on the Rockefeller Family Office NextGen Council and participated in several peer family office groups, which has expanded my perspective on best practices in governance, capital allocation, and next-generation engagement.\n\nOn the quantitative side, I am pursuing both my CFP certification and a MBA at NYU Stern to strengthen my foundation in financial planning, portfolio construction, and strategic decision-making.\n\nThe remaining area I am intentionally developing is hands-on investment experience. Our family office currently outsources investment management, and while that structure may continue, I believe it is essential that I develop the analytical depth and market fluency required to provide informed guidance to family members.\nThis club offers the applied experience I am seeking. Equally important, it provides access to a high-caliber network. Given my involvement in multiple family office communities, I also see an opportunity to serve as a bridge connecting investment ideas and professionals across networks - where appropriate.\n\nMy goal is not so much to “learn investing,” but to become a more effective long-term capital steward and to bring these skills to my family office. I believe this environment would meaningfully accelerate that development.	other	\N	typeform	applied	Applied via Typeform on 2/14/2026, 10:34:37 AM\nPrefers: Email\nAttends: I have attended a number of events put on by FOX as well as Family Business Magazine. I have also attended SEFOF and a number of smaller events as a part of various peer groups.\nCommunities: FOX and FORGE, as well as a few small peer groups.\nInterest: I have found the “debasement trade” and the related run in gold and silver over the past year to be particularly compelling. It has been interesting to watch as the narrative has shifted quickly with fiscal headlines, geopolitical developments, and central bank activity.\n\nGold - and increasingly silver - appear to be trading less as traditional crisis hedges and more as structural hedges against sovereign credibility risk. Unlike prior cycles, gold has advanced despite firm real yields, a resilient dollar, and strong equity markets. That breakdown in historical correlations suggests the market is responding less to cyclical risk and more to concerns around long-term currency debasement.	[]	\N	f	\N	2026-02-14 10:34:38.787+00	2026-02-14 10:34:38.787+00
43c32f2e-cf4d-4ebd-b49b-153ee602442c	Shan	shan.urrehman@anfal.com	97333673656	Bahrain	https://www.linkedin.com/feed/	Work: Investment Manager | Education: CFA Charterholder | Family Office Role: Manager | VC Experience: Actively investing and learning | Investing Capacity: $100K-1M | Authority: Independently | Interests: Reading Market Insights | Why Joining: Increase knowledge in VC investing	other	\N	typeform	applied	Applied via Typeform on 2/15/2026, 7:10:41 AM\nPrefers: Text / WhatsApp\nInterest: AI\nNote: NA	[]	\N	f	\N	2026-02-15 07:10:43.249+00	2026-02-15 07:10:43.249+00
59597d83-2e2e-4192-ba2a-3d924c08037d	Ania	ania.levina1@gmail.com	+31 0639239914	Amsterdam, Netherlands	https://www.linkedin.com/in/alevina16/	Work: I am currently on a career break. I invest in VC and stock market | Education: PhD in Chemistry from Harvard | Family Office Role: I work on our family's financial planning and investment strategy | VC Experience: Actively investing and learning | Investing Capacity: $100K-1M | Authority: In consultation with family or advisors | Interests: Investing and business | Why Joining: I do financial planning and investing for my family and would like to learn more about VC investing.	other	\N	typeform	applied	Applied via Typeform on 2/16/2026, 12:59:28 PM\nPrefers: Email\nInterest: Application of AI to healthcare, law, and reshaping the SAS landscape	[]	\N	f	\N	2026-02-16 12:59:29.918+00	2026-02-16 12:59:29.918+00
5b0098ed-d0db-4a77-8278-32feff78b72e	Jeremy	jeremywertheimer@gmail.com	16174709890	Brookline, MA	https://www.linkedin.com/in/jeremy-wertheimer/	Work: entrepreneur, investor, philanthropist | Education: PhD AI MIT | Family Office Role: CEO | VC Experience: Actively investing and learning | Investing Capacity: $1M-$3M | Authority: Independently | Interests: AI, Neuroscience, Drug Discovery, Education | Why Joining: I'm self-taught. Would love to compare notes and learn from others. And share what I've learned (from being a CEO, and investor, etc.).	other	\N	typeform	applied	Applied via Typeform on 2/16/2026, 2:03:55 PM\nPrefers: Email\nInterest: I have started companies applying AI to Neuroscience	[]	\N	f	\N	2026-02-16 14:03:56.579+00	2026-02-16 14:03:56.579+00
1159629f-fff4-456e-b1b4-235c7259da4d	Fiona 						personal_contact	\N	Tuleeka 	interested		[]	\N	f	\N	2026-02-19 17:12:34.539464+00	2026-02-19 17:12:34.539464+00
c21376a7-8d3a-4dd6-b0d0-44f59acb3b4e	Prarthana						personal_contact	\N	Tuleeka	interested		[]	\N	f	\N	2026-02-19 17:13:50.301374+00	2026-02-19 17:13:50.301374+00
a2a4dab5-78ae-432c-8976-37ac9bb26264	Charlie	charles.u.evans@gmail.com	4086565123	New York	https://www.linkedin.com/in/chevans9/	Work: Technology consultant to a multi-generational family office | Education: M.S. in Data Science, B.S. in Electrical Engineering | Family Office Role: Family member and Technology Consultant to the family office | VC Experience: Some exposure | Investing Capacity: $100K-1M | Authority: Independently | Interests: I’m interested in private family capital and long-term capital allocation across public and private markets. I currently consult for my family office as a technology consultant, and am working toward my CFP certification to deepen my understanding of family office operations. Outside of work, I play and watch soccer regularly, enjoy endurance running and skiing, follow Formula 1, and pursue photography as a creative outlet. | Why Joining: Through my experience as a board observer at our family’s operating company, I’ve gained insight into governance and strategic decision-making. While my exposure to investment evaluation has been limited, it sparked a desire to develop a stronger understanding of how private investments are assessed and managed. I see this cohort as a way to build that capability and contribute more meaningfully over time.	other	\N	typeform	applied	Applied via Typeform on 2/24/2026, 4:27:53 AM\nPrefers: Text / WhatsApp\nAttends: Family Office Exchange events. Planning to attend the upcoming Private Family Capital Summit next month.\nCommunities: I’m engaged with Family Office Exchange (FOX) and have attended Rockefeller client events.\nInterest: I’ve been paying attention to Oura because it sits at an interesting intersection between consumer hardware and long-term health data, and it’s a company I want to keep a close eye on as it develops. While the ring is the entry point, I’m more interested in whether collecting years of biometric data can create a real edge over time. As predictive tools improve, individualized baselines may become more valuable than one-off measurements, particularly if they enable more personalized insights. The open question for me is whether Oura should move further into healthcare integration at all. That path could significantly expand its addressable market, but it would also introduce regulatory complexity, slower product cycles, and higher validation and oversight costs. They’re also experimenting with institutional distribution through Oura for Organizations, which makes me curious how enterprise partnerships compare to consumer subscriptions in terms of economics and operational complexity. I don’t have insight into their financials, but I’m interested in watching how those tradeoffs shape the business as it scales.	[]	\N	f	\N	2026-02-24 04:27:55.035+00	2026-02-24 04:27:55.035+00
29174f4d-5b2d-452a-8ec8-70191d29397e	Jane Foe	Jane.foe@gmail.com					personal_contact	\N		admitted		[]	welcome876	f	\N	2026-02-26 17:07:18.450884+00	2026-03-18 19:57:12.417439+00
10d5f27f-d123-44bf-8dc1-d14d4d967fbc	Jack	john.rubocki3@gmail.com	2086009403	Boise	www.linkedin.com/in/jack-rubocki	Work: Full-time college student. Last summer, I worked at Trailhead (our local startup incubator) in Boise and may return this summer. | Education: I previously attended Franklin & Marshall College and now attend University of Austin (UATX). I’m in my second year of college overall, but classified as a freshman after transferring. | Family Office Role: Not applicable | VC Experience: Some exposure | Investing Capacity: $100K-1M | Authority: In consultation with family or advisors | Interests: On the professional side, I’m interested in business, finance, investing, and entrepreneurship. Personally, I’m very involved in sports, especially baseball, and am taking on the role of Athletic Director at my school as it continues to grow as a startup institution. I also enjoy playing guitar and love spending time outdoors. | Why Joining: I’ve long been interested in investing and manage my own portfolio, but being at UATX has made venture feel much more tangible. I’m constantly around conversations about capital, institution-building, and long-term impact, which has pushed me to want a disciplined understanding of venture, not just surface-level exposure.\n\nI’ve had some early exposure to venture through my dad, including investing in StatusPRO, and that showed me how nuanced early-stage investing really is. Getting excited about a company is easy; understanding ownership, portfolio construction, and power-law dynamics is much harder.\n\nLong-term, I expect venture to be a meaningful part of how I think about capital allocation. This program stands out because it’s centered on real deals and real underwriting. I’d rather build the right framework now, alongside serious participants, than try to approach it casually later.	other	\N	typeform	applied	Applied via Typeform on 3/3/2026, 8:33:01 PM\nPrefers: Email\nInterest: One thing I’m really interested in right now is AI, especially where it intersects with space. AI already feels like it’s becoming foundational across industries, but in space it’s not just helpful, it’s necessary. When you’re dealing with satellites, data systems, or defense applications, you can’t rely on constant human oversight. The systems have to think and act on their own.\n\nAs space becomes more commercially and strategically important, I think AI will quietly become the backbone of how a lot of it functions such as navigation, data processing, optimization, security, etc. That intersection of frontier technology and real-world infrastructure is interesting to me.\n\nMore broadly, I’m interested in AI because it feels structural, not cyclical. It’s reshaping how companies operate and how capital gets allocated. I’m drawn to technologies that compound over long time horizons, and AI seems like one of those foundational shifts\nNote: Although I don’t come from an existing family office, building something like that over time is a real goal of mine. I see opportunities like this, combined with entrepreneurship, as the starting point.\n\nI strongly believe real-world experience is just as important as formal education. Being at UATX gives me a rigorous intellectual foundation, but I’m intentional about pairing that with practical exposure to capital allocation and long-term decision-making. I’d view this as a way to complement my education with responsibility and hands-on learning.\n\nLong-term, I’m trying to build competency, not just credentials.	[]	\N	f	\N	2026-03-03 20:33:03.101+00	2026-03-03 20:33:03.101+00
544932b1-fa4b-4b1b-9c08-89d3a9575429	Test	test@test.com	16035551212	test	test	Work: no | Education: no | Family Office Role: no | VC Experience: Some exposure | Investing Capacity: $100K-1M | Authority: Independently | Interests: no | Why Joining: no	other	\N	typeform	applied	Applied via Typeform on 3/5/2026, 7:04:42 AM\nPrefers: Email\nInterest: no\nNote: no	[]	\N	f	\N	2026-03-05 07:04:44.103+00	2026-03-05 07:04:44.103+00
48ae861b-4d4e-4dd0-b0ee-66c711801cf1	Hilary	hilary.nicolls@monarchinvestment.com	405-902-0475	Golden	https://www.linkedin.com/in/hilary-nicolls-b844535a/	Work: Investment Advisor for my father-in-law's family office | Education: BBA Accounting and Finance, MA Political Science, CPA | Family Office Role: Investment Advisor | VC Experience: Actively investing and learning | Investing Capacity: $1M-$3M | Authority: In consultation with family or advisors | Interests: Investing, philanthropy, outdoor recreation, motherhood, running | Why Joining: I invest for my family office and would like to hone my process and judgment. I haven't seen a program like this and believe the cohort and network setting would be very valuable.	other	\N	typeform	applied	Applied via Typeform on 3/6/2026, 7:55:46 PM\nPrefers: Email\nAttends: Family Office Round Table (FORT) meetings in Denver, CO\nCommunities: FORT\nInterest: Rely AI - lease audits for commercial real estate\nNote: I recently started managing my father-in-law's family office. He built his wealth in multifamily commercial real estate. I am sourcing and recommending deals to him outside of real estate to diversify his portfolio. I am also developing the strategic foundation of our family office. I have a background in venture/growth equity and am a CPA. Looking forward to learning more.	[]	\N	f	\N	2026-03-06 19:55:48.152+00	2026-03-06 19:55:48.152+00
8f0b938e-63c2-4f62-be57-a10c850c3300	Fiona	zhoufiona03@gmail.com	+1 2676299757	New York	https://www.linkedin.com/in/fiona-zhou-1511709b/	Work: JAD Capital Partner | Education: Berkely MBA | Family Office Role: Me and my husband build our fund together, I`m the partner | VC Experience: Actively investing and learning | Investing Capacity: $100K-1M | Authority: Independently | Interests: Reading, Yoga, travelling | Why Joining: I’m interested in joining the Alumni Venture Club because I believe the alumni community is one of the most powerful networks for discovering and supporting exceptional founders. As an investor focused on emerging technologies such as AI, XR, and global innovation, I value environments where experienced operators, investors, and builders can exchange ideas and collaborate on opportunities.\n\nI have spent several years investing in and supporting early-stage technology companies, and I’m particularly interested in connecting with alumni who are building or scaling ambitious ventures. I hope to both contribute my perspective as an investor and learn from other members of the community who bring diverse industry and entrepreneurial experiences.	other	\N	typeform	applied	Applied via Typeform on 3/13/2026, 7:02:01 PM\nPrefers: Text / WhatsApp\nAttends: Opal Group’s Family Office Private Wealth events\nCommunities: A few in NYC and SF\nInterest: I’m particularly interested in the convergence of AI and spatial computing. Advances in generative AI and multimodal models are enabling more natural ways for people to interact with digital environments through XR and mixed reality. I think this combination will reshape areas like gaming, design, and collaboration, and create entirely new computing platforms and content ecosystems.	[]	\N	f	\N	2026-03-13 19:02:02.944+00	2026-03-13 19:02:02.944+00
d1d2df11-690f-41af-95a5-822f96d1618d	Harini	harinikesamneni@gmail.com	+1 7813666434	Wellesley	https://in.linkedin.com/in/harini-kesamneni	Work: I am a student currently but I also have a private equity analyst role in Private Equity Accelerator as well as a private equity intern in real estate. | Education: Bachelors of science in businesses administration at Babson college. Currently a rising senior and completed high school in an international school with IB curriculum | Family Office Role: Investment analyst: Researches investment opportunities, builds financial models, performs due diligence, and helps evaluate deals in areas like VC, PE, or real estate. | VC Experience: Some exposure | Investing Capacity: $100K-1M | Authority: In consultation with family or advisors | Interests: My interests include horse riding, I am a professional jumper. Professionally I am into VC and Private equity and what to build a career out of it. I am also intrested in entrepreneurship coming from a family business background the roots of being an owner to your business are strongly rooted in me. The | Why Joining: I’m interested in joining this club because I have developed a strong interest in venture capital through my experiences working in multiple finance internships. Those roles exposed me to how early-stage companies create value and how investors evaluate opportunities. I would love to continue learning about venture investing while collaborating with others who share the same interest.	other	\N	typeform	applied	Applied via Typeform on 3/13/2026, 8:00:25 PM\nPrefers: Text / WhatsApp\nAttends: Private wealth New England forum\nCommunities: Bertarelli institute of family entrepreneurship, Herring\nInterest: One trend I find really interesting right now is the tokenization of assets. Tokenization allows real-world assets like real estate, private equity, or art to be represented as digital tokens on a blockchain, which makes them easier to trade and accessible to more investors. I find it exciting because it has the potential to increase liquidity in traditionally illiquid markets and completely change how people invest in alternative assets.\nNote: Happy to know people and help them	[]	\N	f	\N	2026-03-13 20:00:27.439+00	2026-03-13 20:00:27.439+00
ddd4d5a9-2119-4d62-9e27-229015b43ee0	Joselyn Armas	jarmas1@babson.edu	1 (781) 312-5416	Swampscott, MA	https://www.linkedin.com/in/joselynarmas/	Work: I serve as a Program Assistant at the Tariq Farid Franchising Institute at Babson College, where I support initiatives related to franchising education, events, and student engagement. | Education: I am currently a sophomore at Babson College pursuing a Bachelor of Science in Business Administration as a Presidential and Franchise Leadership Scholar. I am concentrating in Entrepreneurship and International Business. | Family Office Role: I support my family’s remodeling business in an administrative role, primarily assisting with invoicing processes and client communications. I help ensure that billing records are organized and accurate, and I contribute to maintaining clear and professional interactions with clients throughout project timelines. This experience has given me practical exposure to the financial flow and relationship management required to operate a service business across multiple states. | VC Experience: Some exposure | Investing Capacity: $100K-1M | Authority: In consultation with family or advisors | Interests: Professionally, I am interested in global business and emerging markets, particularly in how innovation and technology integration can drive economic growth and expand access to opportunities. I am also passionate about developing cross-cultural communication skills through learning new languages. Personally, I enjoy photography, running, and reading dystopian literature. | Why Joining: I am interested in joining because my understanding of business has been shaped by growing up around my family’s remodeling company, which operates across six states in the Northeast. Being exposed to the operational realities of managing projects in different regional markets, coordinating teams, and sustaining long-term client relationships has made me increasingly interested in how operating businesses transition from local growth to more strategic capital allocation and scalable expansion.\n\nI am particularly drawn to the club’s experiential approach to venture investing because I want to develop a deeper understanding of how investors evaluate early-stage opportunities, manage uncertainty, and support innovation across industries. As I continue to explore interests in global business, emerging markets, and technology-driven growth, I see this environment as a place where I can strengthen my investment perspective while contributing insights shaped by real multi-state operational exposure and an entrepreneurial mindset.	other	\N	typeform	applied	Applied via Typeform on 3/15/2026, 2:35:27 AM\nPrefers: Text / WhatsApp\nCommunities: I am involved with the Bertarelli Institute for Family Entrepreneurship (BIFE) at Babson College, where I engage in programming related to family business leadership, succession, and entrepreneurial growth.\nInterest: One development I find especially interesting right now is how multi-brand franchise groups are quietly becoming operating platforms rather than simply collections of consumer concepts. From the outside, customers see different menus and brand identities, but much of the real value is being built underneath, through shared supply chains, coordinated real estate strategy, centralized performance data, and standardized training systems that can be applied across brands. What draws my attention is that growth in these models is increasingly driven by how intelligently the network itself is designed, not just by how quickly individual locations expand.\nCompanies like Inspire Brands or Restaurant Brands International illustrate this shift well. Their long-term advantage seems to come less from any single brand and more from their ability to compound operational knowledge across a portfolio. In that structure, expansion becomes a question of infrastructure: how efficiently new units can be supported, how franchisees are selected and incentivized, and how regional insights can be translated into repeatable execution. I find this compelling because it reframes franchising as a form of systems engineering rather than purely a marketing or retail exercise.\nComing from a family remodeling business that operates across six states in the Northeast, I have seen how difficult it is to scale consistency while still responding to local market realities. That exposure has made me interested in how platform-driven franchise models can create both discipline and adaptability at the same time. Long term, I am interested in working at the intersection of operating strategy and capital deployment in sectors where fragmented regional businesses can be organized into more resilient, scalable networks. Understanding how investors identify and build these platforms is something I am particularly motivated to explore.\nNote: In addition to my exposure to our family’s remodeling business in the United States, I grew up spending summers near my uncle’s coffee ranch and import–export operation in Guatemala. Through that experience, I gained early insight into how agricultural production connects to international demand, particularly as his business distributes coffee to buyers in European markets such as Switzerland and Austria. Observing the practical realities of commodity pricing, export logistics, and long-term commercial relationships gave me a firsthand understanding of how locally rooted enterprises participate in global value chains.\n\nThis exposure has shaped my interest in how capital, infrastructure, and investment strategy can influence growth opportunities in emerging economies. Over time, I am interested in exploring how businesses that originate in developing markets can scale internationally while building more resilient operational and financial structures.	[]	\N	f	\N	2026-03-15 02:35:29.616+00	2026-03-15 02:35:29.616+00
5e104025-ee22-4d39-8da6-ec9beb40f403	Mitch	mitch@traverseholdings.co	9522176016	Minneapolis	https://www.linkedin.com/in/mitch-rydeen/	Work: Ex-McKinsey Consultant, Ex-Biotech Operator, now private market investing for family. | Education: BS in Finance UMN | Family Office Role: Principal | VC Experience: Actively investing and learning | Investing Capacity: $1M-$3M | Authority: In consultation with family or advisors | Interests: sciences, fishing, epstimology, financial engineering | Why Joining: Met Matt at Boost VC summer party and enjoyed the conversation	other	\N	typeform	applied	Applied via Typeform on 4/3/2026, 4:29:03 PM\nPrefers: Text / WhatsApp\nCommunities: Chatham house rules\nInterest: Wrapping my head around the space industry right now, also keen on medical diagnostics and instrumentation, and food (family background is in cheese manufacturing)	[]	\N	f	\N	2026-04-03 16:29:04.674+00	2026-04-03 16:29:04.674+00
bd7b899d-5d60-4626-9f17-c77bf38b6844	Daniel	daniel@shargroup.com	4164025162	Toronto	https://www.linkedin.com/in/daniel-taylor-b385177a/	Work: Sole employee at a single family office | Education: Business undergrad, CPA, Chartered Insolvency and Restructuring Professional | Family Office Role: Finance, Investments, Operations | VC Experience: Actively investing and learning | Investing Capacity: >$5M | Authority: As part of a family office or similar structure | Interests: Investing, technology, fitness (running, biking), reading | Why Joining: I run a single family office where I'm already evaluating deep tech VC funds, writing LP memos, and building out portfolio infrastructure. This club would provide access to like minded peers, top tier deal flow and a forum for sharing ideas/deals with people doing the same work I am. It's a natural extension of what I'm already doing.	other	\N	typeform	applied	Applied via Typeform on 4/5/2026, 3:33:11 PM\nPrefers: Email\nAttends: Cambridge Family Office Forum\nCommunities: Canadian Family Office Young Professional\nInterest: Paradromics' brain-computer interface (BCI) platform. I come from a family of physicians, so healthcare innovation is something I've always paid close attention to. Paradromics is particularily interesting since it's a deep tech company tackling neuroscience with an AI-driven platform, which maps directly to the kind of frontier technology bets I am drawn towards. The clinical applications (paralysis, chronic pain, depression) are the exact conditions my siblings see in practice, and the platform approach (being adaptable across multiple brain health use cases) makes it a much more interesting investment thesis than a single-indication play.\nNote: I bring a CPA + CIRP background from my time working corporate restructuring, so I can evaluate deals with real financial diligence as opposed to just pattern matching. I'm experienced in designing and implementing creative capital structures and through my work at FirstPrinciples, I have an active sourcing network across frontier AI and quantum research, so I'd be adding deal flow and technical perspective to the cohort, not just occupying a seat.	[]	\N	f	\N	2026-04-05 15:33:13.816+00	2026-04-05 15:33:13.816+00
b5a9e166-c6fd-4489-afe4-a8e2f9112cd3	Sam	smchood@parlayo.com	480-274-8944	Austin	https://www.linkedin.com/in/samantha-mchood-38295a152/	Work: I work as a senior financial analyst at my family office (where my dad and his cofounder are the principals). | Education: MBA, University of Texas Austin | Family Office Role: Senior financial analyst, daughter of principal who is training me to run family office when he passes | VC Experience: Some exposure | Investing Capacity: $100K-1M | Authority: As part of a family office or similar structure | Interests: Continuous learning (currently studying for my CFA Level 1 exam), increasing efficiency within my own family office, how to measure success quantitatively and qualitatively within our office, AI | Why Joining: To learn a structured way to evaluate deals since we are constantly evaluating opportunities and do not currently have the in-house capabilities to evaluate all deals on our own without relying on wealth managers. As the second generation in my family office, I see that this is a gap that we currently have and I'd like to be the one to own and solve it.	other	\N	typeform	applied	Applied via Typeform on 4/6/2026, 6:04:43 PM\nPrefers: Email\nCommunities: Denver Family Office Round Table (FORT)\nInterest: We're very interested in the AI trend and using AI to increase efficiency within our family office to reduce reliance on employees who operate on their own schedules and timelines. The primary goal is leveling the information playing field between staff and principals. Historically, employees have held informational advantages simply by virtue of being closer to the day-to-day. By giving our principals direct access to the same information, we've shifted that dynamic. The result is a bigger-picture perspective at the principal level, faster and more confident decision-making, and greater strategic control over the direction of our family office.	[]	\N	f	\N	2026-04-06 18:04:44.931+00	2026-04-06 18:04:44.931+00
2e4d05fa-7103-416f-8962-bd6b8236ae69	Blair	blair@jadevisioncapital.com	16464066492	New York	www.linkedin.com/in/blair-cheng	Work: Jade Vision Capital Family Office | Education: Master of science in City University of Hong Kong | Family Office Role: Investment Director | VC Experience: Actively investing and learning | Investing Capacity: $100K-1M | Authority: In consultation with family or advisors | Interests: professional | Why Joining: Allocate assets in SPV deals	other	\N	typeform	applied	Applied via Typeform on 4/8/2026, 6:53:42 PM\nPrefers: Email\nInterest: Consumer tech and disruptive tech, biotech	[]	\N	f	\N	2026-04-08 18:53:44.369+00	2026-04-08 18:53:44.369+00
cca6529f-e7a7-482f-8fd4-0e54696a76bd	Sajjad	sajjadzulfiqar001@gmail.com	+923077555850	Hasilpur	https://pk.linkedin.com/in/sajjad-zulfiqar-413906230	Work: Open scout VC and Web3 Tech, investment strategist. I source early-stage deals, conduct DeFi protocol research, advise Web3 founders in the UK and US, and run a global OTC crypto network. BS CS student, Python practitioner, active in the AI and blockchain investment space. | Education: Bachelors in Computer Science | Family Office Role: I do not work inside a family office directly. I operate independently as an open scout and investment strategist, and a portion of my network includes family office managers and principals mainly across the UK, Middle East, and emerging markets who I have connected with through crypto OTC deal flow and Web3 investment advisory work. My role with them is informal but real. I surface deal opportunities, share investment research, and occasionally facilitate introductions to founders they would not otherwise see. It is relationship-driven, not institutional which is partly why I am pursuing this fellowship. I want to build the formal investment experience that sits underneath the network I have already built. | VC Experience: Some exposure | Investing Capacity: Not now, but soon | Authority: In consultation with family or advisors | Interests: AI and blockchain are eating real-world infrastructure right now. New asset classes, new business models things that genuinely did not exist five years ago. I follow this closely, not through newsletters but through on-chain data, direct founder conversations, and watching how adoption actually moves in emerging markets versus how people in the West think it moves. On the personal side i am fascinated by why people make the financial decisions they do. Not the rational model. The real one. Growing up in Pakistan you see financial exclusion up close. People who are smart, hardworking, and completely locked out of basic financial tools that someone in London takes for granted. That stays with you. It shapes how I look at companies whether they are solving something that genuinely changes lives or just building another product for people who already have too many options. Beyond that I am just someone who likes understanding how things actually work. Not the surface explanation the incentive underneath it. Why does this protocol behave this way. Why did that market move like that. Why do people say one thing and do another with their money. That curiosity is what pulled me into this space and it is what keeps me here. | Why Joining: Two reasons, honestly.\n\nFirst the people who came through this program built real careers. Not just internship lines on a resume. Actual funds, actual teams. That tells me this is a place that treats fellows like contributors, not interns.\n\nSecond the model makes sense to me. $1.5 billion built through a trusted network of 11,000 investors, not a handful of institutional gatekeepers. I have spent two years building my own network in crypto and Web3 the same way  one genuine relationship at a time. The philosophy fits.\n\nI am at the point where I have the raw material but need the right environment to sharpen it. This feels like that environment.	other	\N	typeform	applied	Applied via Typeform on 4/11/2026, 10:24:50 AM\nPrefers: Text / WhatsApp\nCommunities: I am not a formal member of any institutional family office association yet. Most of my family office exposure has come through direct relationships built over two years in the crypto and Web3 space private Telegram communities where family office principals and UHNWI investors are active, OTC deal networks where I have worked alongside family office capital directly, and Web3 investment circles in the UK and Middle East where family offices are increasingly participating.  I have also been engaging with the broader private capital community through the Princeton Business Today International Conference and actively building toward more structured involvement which is part of what drew me to Alumni Ventures specifically.\nInterest: Blockchain+AI, Fintech+AI, Biotech+AI. AI speedup your working & other three are inevitability in all time. So, all these are trends i like to invest.\nNote: That i can join as remote.	[]	\N	f	\N	2026-04-11 10:24:52.335+00	2026-04-11 10:24:52.335+00
\.


--
-- Data for Name: session_rsvps; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.session_rsvps (id, session_id, member_id, attending, created_at) FROM stdin;
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sessions (id, title, description, type, date, "time", timezone, duration, host_name, host_title, host_linkedin, zoom_link, recording_url, deal_id, created_at, google_calendar_link, attendees, participants, meeting_notes) FROM stdin;
\.


--
-- Data for Name: site_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.site_settings (id, club_name, club_subtitle, cohort_name, primary_color, accent_color, logo_url, created_at, logo_background_color, cohort_number, email_test_mode) FROM stdin;
5a3aa484-d70e-4143-b320-d3ed516b3a41	Next Gen	Venture Club	Cohort 2	#1B4D5C	#b1a5c0	/av-logo.png	2026-02-04 19:07:50.093105+00	#efebf4	2	f
\.


--
-- Name: admin_sessions admin_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_sessions
    ADD CONSTRAINT admin_sessions_pkey PRIMARY KEY (id);


--
-- Name: admin_settings admin_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.admin_settings
    ADD CONSTRAINT admin_settings_pkey PRIMARY KEY (id);


--
-- Name: announcements announcements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_pkey PRIMARY KEY (id);


--
-- Name: av_team av_team_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.av_team
    ADD CONSTRAINT av_team_pkey PRIMARY KEY (id);


--
-- Name: candidates candidates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.candidates
    ADD CONSTRAINT candidates_pkey PRIMARY KEY (id);


--
-- Name: cohorts cohorts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cohorts
    ADD CONSTRAINT cohorts_pkey PRIMARY KEY (id);


--
-- Name: content content_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.content
    ADD CONSTRAINT content_pkey PRIMARY KEY (id);


--
-- Name: deal_interests deal_interests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deal_interests
    ADD CONSTRAINT deal_interests_pkey PRIMARY KEY (id);


--
-- Name: deals deals_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deals
    ADD CONSTRAINT deals_pkey PRIMARY KEY (id);


--
-- Name: idea_bin_bullets idea_bin_bullets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.idea_bin_bullets
    ADD CONSTRAINT idea_bin_bullets_pkey PRIMARY KEY (id);


--
-- Name: idea_bin idea_bin_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.idea_bin
    ADD CONSTRAINT idea_bin_pkey PRIMARY KEY (id);


--
-- Name: intro_requests intro_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intro_requests
    ADD CONSTRAINT intro_requests_pkey PRIMARY KEY (id);


--
-- Name: member_blocks member_blocks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.member_blocks
    ADD CONSTRAINT member_blocks_pkey PRIMARY KEY (id);


--
-- Name: member_onboarding member_onboarding_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.member_onboarding
    ADD CONSTRAINT member_onboarding_pkey PRIMARY KEY (id);


--
-- Name: member_reports member_reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.member_reports
    ADD CONSTRAINT member_reports_pkey PRIMARY KEY (id);


--
-- Name: member_sessions member_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.member_sessions
    ADD CONSTRAINT member_sessions_pkey PRIMARY KEY (id);


--
-- Name: members members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.members
    ADD CONSTRAINT members_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: portfolio_investments portfolio_investments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portfolio_investments
    ADD CONSTRAINT portfolio_investments_pkey PRIMARY KEY (id);


--
-- Name: recruit_stage_descriptions recruit_stage_descriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recruit_stage_descriptions
    ADD CONSTRAINT recruit_stage_descriptions_pkey PRIMARY KEY (id);


--
-- Name: recruits recruits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recruits
    ADD CONSTRAINT recruits_pkey PRIMARY KEY (id);


--
-- Name: session_rsvps session_rsvps_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_rsvps
    ADD CONSTRAINT session_rsvps_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: site_settings site_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.site_settings
    ADD CONSTRAINT site_settings_pkey PRIMARY KEY (id);


--
-- Name: admin_sessions_device_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX admin_sessions_device_id_key ON public.admin_sessions USING btree (device_id);


--
-- Name: av_team_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX av_team_email_key ON public.av_team USING btree (email);


--
-- Name: deal_interests_archived_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX deal_interests_archived_idx ON public.deal_interests USING btree (archived);


--
-- Name: deal_interests_unique_member_deal; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX deal_interests_unique_member_deal ON public.deal_interests USING btree (member_id, deal_id);


--
-- Name: idx_admin_sessions_device; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_admin_sessions_device ON public.admin_sessions USING btree (device_id);


--
-- Name: idx_av_team_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_av_team_email ON public.av_team USING btree (email);


--
-- Name: idx_av_team_visible; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_av_team_visible ON public.av_team USING btree (is_visible_to_members) WHERE (is_visible_to_members = true);


--
-- Name: idx_deal_interests_deal_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_deal_interests_deal_id ON public.deal_interests USING btree (deal_id);


--
-- Name: idx_deal_interests_member_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_deal_interests_member_id ON public.deal_interests USING btree (member_id);


--
-- Name: idx_deal_interests_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_deal_interests_status ON public.deal_interests USING btree (status);


--
-- Name: idx_deals_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_deals_status ON public.deals USING btree (status);


--
-- Name: idx_intro_requests_members; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_intro_requests_members ON public.intro_requests USING btree (from_member_id, to_member_id);


--
-- Name: idx_member_sessions_device; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_member_sessions_device ON public.member_sessions USING btree (device_id);


--
-- Name: idx_members_auth_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_members_auth_user_id ON public.members USING btree (auth_user_id);


--
-- Name: idx_members_cohort; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_members_cohort ON public.members USING btree (cohort_id);


--
-- Name: idx_members_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_members_email ON public.members USING btree (email);


--
-- Name: idx_messages_members; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_members ON public.messages USING btree (from_member_id, to_member_id);


--
-- Name: idx_portfolio_member; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_portfolio_member ON public.portfolio_investments USING btree (member_id);


--
-- Name: idx_sessions_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_sessions_date ON public.sessions USING btree (date);


--
-- Name: members_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX members_email_key ON public.members USING btree (email);


--
-- Name: recruit_stage_descriptions_stage_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX recruit_stage_descriptions_stage_key ON public.recruit_stage_descriptions USING btree (stage);


--
-- Name: idea_bin_bullets set_idea_bin_bullets_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_idea_bin_bullets_updated_at BEFORE UPDATE ON public.idea_bin_bullets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: idea_bin set_idea_bin_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER set_idea_bin_updated_at BEFORE UPDATE ON public.idea_bin FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: recruits update_recruits_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_recruits_updated_at BEFORE UPDATE ON public.recruits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: announcements announcements_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.members(id);


--
-- Name: candidates candidates_cohort_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.candidates
    ADD CONSTRAINT candidates_cohort_id_fkey FOREIGN KEY (cohort_id) REFERENCES public.cohorts(id);


--
-- Name: deal_interests deal_interests_deal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deal_interests
    ADD CONSTRAINT deal_interests_deal_id_fkey FOREIGN KEY (deal_id) REFERENCES public.deals(id) ON DELETE CASCADE;


--
-- Name: deal_interests deal_interests_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.deal_interests
    ADD CONSTRAINT deal_interests_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE;


--
-- Name: idea_bin_bullets idea_bin_bullets_idea_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.idea_bin_bullets
    ADD CONSTRAINT idea_bin_bullets_idea_id_fkey FOREIGN KEY (idea_id) REFERENCES public.idea_bin(id) ON DELETE CASCADE;


--
-- Name: idea_bin_bullets idea_bin_bullets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.idea_bin_bullets
    ADD CONSTRAINT idea_bin_bullets_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: idea_bin idea_bin_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.idea_bin
    ADD CONSTRAINT idea_bin_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: intro_requests intro_requests_cohort_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intro_requests
    ADD CONSTRAINT intro_requests_cohort_id_fkey FOREIGN KEY (cohort_id) REFERENCES public.cohorts(id);


--
-- Name: intro_requests intro_requests_from_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intro_requests
    ADD CONSTRAINT intro_requests_from_member_id_fkey FOREIGN KEY (from_member_id) REFERENCES public.members(id) ON DELETE CASCADE;


--
-- Name: intro_requests intro_requests_to_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.intro_requests
    ADD CONSTRAINT intro_requests_to_member_id_fkey FOREIGN KEY (to_member_id) REFERENCES public.members(id) ON DELETE CASCADE;


--
-- Name: member_blocks member_blocks_blocked_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.member_blocks
    ADD CONSTRAINT member_blocks_blocked_id_fkey FOREIGN KEY (blocked_id) REFERENCES public.members(id) ON DELETE CASCADE;


--
-- Name: member_blocks member_blocks_blocker_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.member_blocks
    ADD CONSTRAINT member_blocks_blocker_id_fkey FOREIGN KEY (blocker_id) REFERENCES public.members(id) ON DELETE CASCADE;


--
-- Name: member_onboarding member_onboarding_candidate_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.member_onboarding
    ADD CONSTRAINT member_onboarding_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.candidates(id);


--
-- Name: member_onboarding member_onboarding_cohort_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.member_onboarding
    ADD CONSTRAINT member_onboarding_cohort_id_fkey FOREIGN KEY (cohort_id) REFERENCES public.cohorts(id);


--
-- Name: member_reports member_reports_cohort_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.member_reports
    ADD CONSTRAINT member_reports_cohort_id_fkey FOREIGN KEY (cohort_id) REFERENCES public.cohorts(id);


--
-- Name: member_reports member_reports_reported_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.member_reports
    ADD CONSTRAINT member_reports_reported_id_fkey FOREIGN KEY (reported_id) REFERENCES public.members(id) ON DELETE CASCADE;


--
-- Name: member_reports member_reports_reporter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.member_reports
    ADD CONSTRAINT member_reports_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES public.members(id) ON DELETE CASCADE;


--
-- Name: member_sessions member_sessions_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.member_sessions
    ADD CONSTRAINT member_sessions_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE;


--
-- Name: members members_cohort_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.members
    ADD CONSTRAINT members_cohort_id_fkey FOREIGN KEY (cohort_id) REFERENCES public.cohorts(id);


--
-- Name: messages messages_cohort_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_cohort_id_fkey FOREIGN KEY (cohort_id) REFERENCES public.cohorts(id);


--
-- Name: messages messages_from_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_from_member_id_fkey FOREIGN KEY (from_member_id) REFERENCES public.members(id) ON DELETE CASCADE;


--
-- Name: messages messages_intro_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_intro_request_id_fkey FOREIGN KEY (intro_request_id) REFERENCES public.intro_requests(id);


--
-- Name: messages messages_to_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_to_member_id_fkey FOREIGN KEY (to_member_id) REFERENCES public.members(id) ON DELETE CASCADE;


--
-- Name: portfolio_investments portfolio_investments_deal_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portfolio_investments
    ADD CONSTRAINT portfolio_investments_deal_id_fkey FOREIGN KEY (deal_id) REFERENCES public.deals(id) ON DELETE CASCADE;


--
-- Name: portfolio_investments portfolio_investments_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.portfolio_investments
    ADD CONSTRAINT portfolio_investments_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE;


--
-- Name: recruits recruits_av_lead_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recruits
    ADD CONSTRAINT recruits_av_lead_id_fkey FOREIGN KEY (av_lead_id) REFERENCES public.av_team(id);


--
-- Name: recruits recruits_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recruits
    ADD CONSTRAINT recruits_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE SET NULL;


--
-- Name: session_rsvps session_rsvps_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_rsvps
    ADD CONSTRAINT session_rsvps_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.members(id) ON DELETE CASCADE;


--
-- Name: session_rsvps session_rsvps_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.session_rsvps
    ADD CONSTRAINT session_rsvps_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE CASCADE;


--
-- Name: av_team AV team readable by all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "AV team readable by all" ON public.av_team FOR SELECT USING (true);


--
-- Name: av_team AV team writable by service role; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "AV team writable by service role" ON public.av_team USING (true);


--
-- Name: admin_sessions Admin sessions readable by all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin sessions readable by all" ON public.admin_sessions FOR SELECT USING (true);


--
-- Name: admin_sessions Admin sessions writable by service role; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin sessions writable by service role" ON public.admin_sessions USING (true);


--
-- Name: admin_settings Admin settings accessible by service role only; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admin settings accessible by service role only" ON public.admin_settings USING (true);


--
-- Name: deal_interests Admins can delete deal interests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete deal interests" ON public.deal_interests FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.members
  WHERE ((members.auth_user_id = auth.uid()) AND (members.is_manager = true)))));


--
-- Name: announcements Allow all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all" ON public.announcements USING (true);


--
-- Name: av_team Allow all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all" ON public.av_team USING (true);


--
-- Name: content Allow all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all" ON public.content USING (true);


--
-- Name: deals Allow all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all" ON public.deals USING (true);


--
-- Name: intro_requests Allow all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all" ON public.intro_requests USING (true);


--
-- Name: member_blocks Allow all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all" ON public.member_blocks USING (true);


--
-- Name: member_reports Allow all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all" ON public.member_reports USING (true);


--
-- Name: members Allow all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all" ON public.members USING (true);


--
-- Name: messages Allow all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all" ON public.messages USING (true);


--
-- Name: portfolio_investments Allow all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all" ON public.portfolio_investments USING (true);


--
-- Name: recruits Allow all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all" ON public.recruits USING (true);


--
-- Name: session_rsvps Allow all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all" ON public.session_rsvps USING (true);


--
-- Name: sessions Allow all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all" ON public.sessions USING (true);


--
-- Name: site_settings Allow all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all" ON public.site_settings USING (true);


--
-- Name: announcements Allow all operations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all operations" ON public.announcements USING (true) WITH CHECK (true);


--
-- Name: av_team Allow all operations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all operations" ON public.av_team USING (true) WITH CHECK (true);


--
-- Name: content Allow all operations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all operations" ON public.content USING (true) WITH CHECK (true);


--
-- Name: deals Allow all operations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all operations" ON public.deals USING (true) WITH CHECK (true);


--
-- Name: intro_requests Allow all operations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all operations" ON public.intro_requests USING (true) WITH CHECK (true);


--
-- Name: member_blocks Allow all operations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all operations" ON public.member_blocks USING (true) WITH CHECK (true);


--
-- Name: member_reports Allow all operations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all operations" ON public.member_reports USING (true) WITH CHECK (true);


--
-- Name: members Allow all operations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all operations" ON public.members USING (true) WITH CHECK (true);


--
-- Name: messages Allow all operations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all operations" ON public.messages USING (true) WITH CHECK (true);


--
-- Name: portfolio_investments Allow all operations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all operations" ON public.portfolio_investments USING (true) WITH CHECK (true);


--
-- Name: recruits Allow all operations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all operations" ON public.recruits USING (true) WITH CHECK (true);


--
-- Name: session_rsvps Allow all operations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all operations" ON public.session_rsvps USING (true) WITH CHECK (true);


--
-- Name: sessions Allow all operations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all operations" ON public.sessions USING (true) WITH CHECK (true);


--
-- Name: site_settings Allow all operations; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow all operations" ON public.site_settings USING (true) WITH CHECK (true);


--
-- Name: announcements Announcements readable by all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Announcements readable by all" ON public.announcements FOR SELECT USING (true);


--
-- Name: announcements Announcements writable by service role; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Announcements writable by service role" ON public.announcements USING (true);


--
-- Name: announcements Authenticated users can view announcements; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view announcements" ON public.announcements FOR SELECT TO authenticated USING (true);


--
-- Name: content Authenticated users can view content; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view content" ON public.content FOR SELECT TO authenticated USING (true);


--
-- Name: deals Authenticated users can view deals; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view deals" ON public.deals FOR SELECT TO authenticated USING (true);


--
-- Name: sessions Authenticated users can view sessions; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view sessions" ON public.sessions FOR SELECT TO authenticated USING (true);


--
-- Name: candidates Candidates readable by all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Candidates readable by all" ON public.candidates FOR SELECT USING (true);


--
-- Name: candidates Candidates writable by service role; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Candidates writable by service role" ON public.candidates USING (true);


--
-- Name: cohorts Cohorts readable by all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Cohorts readable by all" ON public.cohorts FOR SELECT USING (true);


--
-- Name: cohorts Cohorts writable by service role; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Cohorts writable by service role" ON public.cohorts USING (true);


--
-- Name: content Content readable by all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Content readable by all" ON public.content FOR SELECT USING (true);


--
-- Name: content Content writable by service role; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Content writable by service role" ON public.content USING (true);


--
-- Name: deals Deals readable by all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Deals readable by all" ON public.deals FOR SELECT USING (true);


--
-- Name: deals Deals writable by service role; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Deals writable by service role" ON public.deals USING (true);


--
-- Name: members Enable delete for service role; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable delete for service role" ON public.members FOR DELETE TO service_role USING (true);


--
-- Name: members Enable insert for service role; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable insert for service role" ON public.members FOR INSERT TO service_role WITH CHECK (true);


--
-- Name: members Enable read access for authenticated users; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable read access for authenticated users" ON public.members FOR SELECT TO authenticated USING (true);


--
-- Name: members Enable update for own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable update for own profile" ON public.members FOR UPDATE TO authenticated USING ((auth.uid() = auth_user_id)) WITH CHECK ((auth.uid() = auth_user_id));


--
-- Name: members Enable update for service role; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Enable update for service role" ON public.members FOR UPDATE TO service_role USING (true) WITH CHECK (true);


--
-- Name: intro_requests Intro requests readable by all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Intro requests readable by all" ON public.intro_requests FOR SELECT USING (true);


--
-- Name: intro_requests Intro requests writable by service role; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Intro requests writable by service role" ON public.intro_requests USING (true);


--
-- Name: member_blocks Member blocks readable by all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Member blocks readable by all" ON public.member_blocks FOR SELECT USING (true);


--
-- Name: member_blocks Member blocks writable by service role; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Member blocks writable by service role" ON public.member_blocks USING (true);


--
-- Name: member_onboarding Member onboarding readable by all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Member onboarding readable by all" ON public.member_onboarding FOR SELECT USING (true);


--
-- Name: member_onboarding Member onboarding writable by service role; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Member onboarding writable by service role" ON public.member_onboarding USING (true);


--
-- Name: member_reports Member reports readable by all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Member reports readable by all" ON public.member_reports FOR SELECT USING (true);


--
-- Name: member_reports Member reports writable by service role; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Member reports writable by service role" ON public.member_reports USING (true);


--
-- Name: member_sessions Member sessions readable by all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Member sessions readable by all" ON public.member_sessions FOR SELECT USING (true);


--
-- Name: member_sessions Member sessions writable by service role; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Member sessions writable by service role" ON public.member_sessions USING (true);


--
-- Name: deal_interests Members can insert their own interests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Members can insert their own interests" ON public.deal_interests FOR INSERT WITH CHECK (true);


--
-- Name: deal_interests Members can update their own interests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Members can update their own interests" ON public.deal_interests FOR UPDATE USING (true);


--
-- Name: deal_interests Members can view their own interests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Members can view their own interests" ON public.deal_interests FOR SELECT USING (true);


--
-- Name: members Members readable by all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Members readable by all" ON public.members FOR SELECT USING (true);


--
-- Name: members Members writable by service role; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Members writable by service role" ON public.members USING (true);


--
-- Name: messages Messages readable by all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Messages readable by all" ON public.messages FOR SELECT USING (true);


--
-- Name: messages Messages writable by service role; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Messages writable by service role" ON public.messages USING (true);


--
-- Name: portfolio_investments Portfolio investments readable by all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Portfolio investments readable by all" ON public.portfolio_investments FOR SELECT USING (true);


--
-- Name: portfolio_investments Portfolio investments writable by service role; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Portfolio investments writable by service role" ON public.portfolio_investments USING (true);


--
-- Name: announcements Public read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read" ON public.announcements FOR SELECT USING (true);


--
-- Name: av_team Public read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read" ON public.av_team FOR SELECT USING (true);


--
-- Name: candidates Public read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read" ON public.candidates FOR SELECT USING (true);


--
-- Name: cohorts Public read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read" ON public.cohorts FOR SELECT USING (true);


--
-- Name: content Public read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read" ON public.content FOR SELECT USING (true);


--
-- Name: deals Public read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read" ON public.deals FOR SELECT USING (true);


--
-- Name: intro_requests Public read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read" ON public.intro_requests FOR SELECT USING (true);


--
-- Name: member_blocks Public read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read" ON public.member_blocks FOR SELECT USING (true);


--
-- Name: member_onboarding Public read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read" ON public.member_onboarding FOR SELECT USING (true);


--
-- Name: member_reports Public read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read" ON public.member_reports FOR SELECT USING (true);


--
-- Name: members Public read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read" ON public.members FOR SELECT USING (true);


--
-- Name: messages Public read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read" ON public.messages FOR SELECT USING (true);


--
-- Name: portfolio_investments Public read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read" ON public.portfolio_investments FOR SELECT USING (true);


--
-- Name: recruit_stage_descriptions Public read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read" ON public.recruit_stage_descriptions FOR SELECT USING (true);


--
-- Name: recruits Public read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read" ON public.recruits FOR SELECT USING (true);


--
-- Name: session_rsvps Public read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read" ON public.session_rsvps FOR SELECT USING (true);


--
-- Name: sessions Public read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read" ON public.sessions FOR SELECT USING (true);


--
-- Name: site_settings Public read; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Public read" ON public.site_settings FOR SELECT USING (true);


--
-- Name: recruit_stage_descriptions Recruit stages readable by all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Recruit stages readable by all" ON public.recruit_stage_descriptions FOR SELECT USING (true);


--
-- Name: recruit_stage_descriptions Recruit stages writable by service role; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Recruit stages writable by service role" ON public.recruit_stage_descriptions USING (true);


--
-- Name: recruits Recruits readable by all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Recruits readable by all" ON public.recruits FOR SELECT USING (true);


--
-- Name: recruits Recruits writable by service role; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Recruits writable by service role" ON public.recruits USING (true);


--
-- Name: admin_sessions Service only; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service only" ON public.admin_sessions USING (true);


--
-- Name: admin_settings Service only; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service only" ON public.admin_settings USING (true);


--
-- Name: member_sessions Service only; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service only" ON public.member_sessions USING (true);


--
-- Name: members Service role has full access; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role has full access" ON public.members TO service_role USING (true) WITH CHECK (true);


--
-- Name: session_rsvps Service role has full access to RSVPs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role has full access to RSVPs" ON public.session_rsvps TO service_role USING (true) WITH CHECK (true);


--
-- Name: deal_interests Service role has full access to deal interests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service role has full access to deal interests" ON public.deal_interests TO service_role USING (true) WITH CHECK (true);


--
-- Name: announcements Service write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service write" ON public.announcements USING (true);


--
-- Name: av_team Service write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service write" ON public.av_team USING (true);


--
-- Name: candidates Service write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service write" ON public.candidates USING (true);


--
-- Name: cohorts Service write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service write" ON public.cohorts USING (true);


--
-- Name: content Service write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service write" ON public.content USING (true);


--
-- Name: deals Service write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service write" ON public.deals USING (true);


--
-- Name: intro_requests Service write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service write" ON public.intro_requests USING (true);


--
-- Name: member_blocks Service write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service write" ON public.member_blocks USING (true);


--
-- Name: member_onboarding Service write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service write" ON public.member_onboarding USING (true);


--
-- Name: member_reports Service write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service write" ON public.member_reports USING (true);


--
-- Name: members Service write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service write" ON public.members USING (true);


--
-- Name: messages Service write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service write" ON public.messages USING (true);


--
-- Name: portfolio_investments Service write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service write" ON public.portfolio_investments USING (true);


--
-- Name: recruit_stage_descriptions Service write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service write" ON public.recruit_stage_descriptions USING (true);


--
-- Name: recruits Service write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service write" ON public.recruits USING (true);


--
-- Name: session_rsvps Service write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service write" ON public.session_rsvps USING (true);


--
-- Name: sessions Service write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service write" ON public.sessions USING (true);


--
-- Name: site_settings Service write; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Service write" ON public.site_settings USING (true);


--
-- Name: session_rsvps Session RSVPs readable by all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Session RSVPs readable by all" ON public.session_rsvps FOR SELECT USING (true);


--
-- Name: session_rsvps Session RSVPs writable by service role; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Session RSVPs writable by service role" ON public.session_rsvps USING (true);


--
-- Name: sessions Sessions readable by all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Sessions readable by all" ON public.sessions FOR SELECT USING (true);


--
-- Name: sessions Sessions writable by service role; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Sessions writable by service role" ON public.sessions USING (true);


--
-- Name: site_settings Site settings readable by all; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Site settings readable by all" ON public.site_settings FOR SELECT USING (true);


--
-- Name: site_settings Site settings writable by service role; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Site settings writable by service role" ON public.site_settings USING (true);


--
-- Name: session_rsvps Users can manage own RSVPs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage own RSVPs" ON public.session_rsvps TO authenticated USING ((member_id IN ( SELECT members.id
   FROM public.members
  WHERE (members.auth_user_id = auth.uid())))) WITH CHECK ((member_id IN ( SELECT members.id
   FROM public.members
  WHERE (members.auth_user_id = auth.uid()))));


--
-- Name: deal_interests Users can manage own deal interests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can manage own deal interests" ON public.deal_interests FOR INSERT TO authenticated WITH CHECK ((member_id IN ( SELECT members.id
   FROM public.members
  WHERE (members.auth_user_id = auth.uid()))));


--
-- Name: members Users can update own member data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own member data" ON public.members FOR UPDATE TO authenticated USING ((auth_user_id = auth.uid())) WITH CHECK ((auth_user_id = auth.uid()));


--
-- Name: session_rsvps Users can view own RSVPs; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own RSVPs" ON public.session_rsvps FOR SELECT TO authenticated USING ((member_id IN ( SELECT members.id
   FROM public.members
  WHERE (members.auth_user_id = auth.uid()))));


--
-- Name: deal_interests Users can view own deal interests; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own deal interests" ON public.deal_interests FOR SELECT TO authenticated USING ((member_id IN ( SELECT members.id
   FROM public.members
  WHERE (members.auth_user_id = auth.uid()))));


--
-- Name: members Users can view own member data; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own member data" ON public.members FOR SELECT TO authenticated USING ((auth_user_id = auth.uid()));


--
-- Name: admin_sessions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: admin_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: announcements; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

--
-- Name: av_team; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.av_team ENABLE ROW LEVEL SECURITY;

--
-- Name: candidates; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;

--
-- Name: cohorts; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.cohorts ENABLE ROW LEVEL SECURITY;

--
-- Name: content; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;

--
-- Name: deal_interests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.deal_interests ENABLE ROW LEVEL SECURITY;

--
-- Name: deals; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;

--
-- Name: idea_bin; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.idea_bin ENABLE ROW LEVEL SECURITY;

--
-- Name: idea_bin_bullets; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.idea_bin_bullets ENABLE ROW LEVEL SECURITY;

--
-- Name: idea_bin_bullets idea_bin_bullets_owner; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY idea_bin_bullets_owner ON public.idea_bin_bullets USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));


--
-- Name: idea_bin idea_bin_owner; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY idea_bin_owner ON public.idea_bin USING ((user_id = auth.uid())) WITH CHECK ((user_id = auth.uid()));


--
-- Name: intro_requests; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.intro_requests ENABLE ROW LEVEL SECURITY;

--
-- Name: member_blocks; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.member_blocks ENABLE ROW LEVEL SECURITY;

--
-- Name: member_onboarding; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.member_onboarding ENABLE ROW LEVEL SECURITY;

--
-- Name: member_reports; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.member_reports ENABLE ROW LEVEL SECURITY;

--
-- Name: member_sessions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.member_sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: members; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

--
-- Name: messages; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: portfolio_investments; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.portfolio_investments ENABLE ROW LEVEL SECURITY;

--
-- Name: recruit_stage_descriptions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.recruit_stage_descriptions ENABLE ROW LEVEL SECURITY;

--
-- Name: recruits; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.recruits ENABLE ROW LEVEL SECURITY;

--
-- Name: session_rsvps; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.session_rsvps ENABLE ROW LEVEL SECURITY;

--
-- Name: sessions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: site_settings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--

\unrestrict ueUDmUXsHw3YbF3GfVUzAlnW7b9kv9fxqzSWFhxnNyU5LSoQfAGRpmAFTm17g8H

