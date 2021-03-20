
CREATE SEQUENCE score_card_score_card_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


CREATE TABLE public.score_card
(
  score_card_id integer NOT NULL DEFAULT nextval('score_card_score_card_id_seq'::regclass),
  org_unit_id integer NOT NULL,
  score_card_name character varying(100) NOT NULL,
  instructions character varying(200),
  out_label character varying(50),
  importance integer NOT NULL DEFAULT 1,
  score_card_created_by integer NOT NULL,
  score_card_created timestamp without time zone NOT NULL DEFAULT now(),
  score_card_modified_by integer DEFAULT NULL,
  score_card_modified timestamp without time zone NOT NULL DEFAULT now(),
  title character varying(100),
  score_card_status character varying(10),
  groups integer[],
  CONSTRAINT score_card_pkey PRIMARY KEY (score_card_id),
  CONSTRAINT score_card_org_unit_id_fkey FOREIGN KEY (org_unit_id)
      REFERENCES public.org_unit (org_unit_id) MATCH SIMPLE
      ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE SEQUENCE criteria_criteria_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE TYPE criteria_type AS ENUM ('Pass/Fail','Scale 0-3','Scale 0-5','Scale 0-10');

CREATE TABLE public.score_card_criteria
(
  criteria_id integer NOT NULL DEFAULT nextval('criteria_criteria_id_seq'::regclass),
  score_card_id integer NOT NULL,
  criteria_title character varying(100) NOT NULL,
  help_text character varying(200) NULL,
  criteria_importance integer NOT NULL DEFAULT 1,
  criteria_type  criteria_type NOT NULL DEFAULT 'Pass/Fail',
  criteria_order integer NOT NULL DEFAULT 1,
  is_required boolean DEFAULT false,
  criteria_created timestamp without time zone NOT NULL DEFAULT now(),
  CONSTRAINT criteria_order_check CHECK (criteria_order > 0 AND criteria_order < '11'::integer),
  CONSTRAINT score_card_criteria_pkey PRIMARY KEY (criteria_id),
  CONSTRAINT score_card_criteria_score_card_id_fkey FOREIGN KEY (score_card_id)
      REFERENCES public.score_card (score_card_id) MATCH SIMPLE
      ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE SEQUENCE call_score_card_call__score_card_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE TYPE call_score_status AS ENUM ('Needs Scorecard','Unscored','Scored','Reviewed');

CREATE TABLE public.call_score_card
  (
    call_score_card_id integer NOT NULL DEFAULT nextval('call_score_card_call__score_card_id_seq'::regclass),
    call_id integer NOT NULL,
    user_id integer NOT NULL,
    score_card_id integer NOT NULL,
    score integer NOT NULL DEFAULT 0,
    call_score_status call_score_status NOT NULL DEFAULT 'Needs Scorecard',
    call_scored_by integer DEFAULT NULL,
    call_scored_date timestamp without time zone NOT NULL DEFAULT now(),
    call_score_reviewed timestamp without time zone NOT NULL DEFAULT now(),
    appt_booked boolean DEFAULT false,
    CONSTRAINT score_check CHECK (score < '101'::integer),
    CONSTRAINT call_score_card_pkey PRIMARY KEY (call_score_card_id),
    CONSTRAINT call_score_card_call_id_fkey FOREIGN KEY (call_id)
        REFERENCES public.call_detail (call_id) MATCH SIMPLE
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT call_score_card_score_card_id_fkey FOREIGN KEY (score_card_id)
        REFERENCES public.score_card (score_card_id) MATCH SIMPLE
        ON UPDATE CASCADE ON DELETE CASCADE
  );

CREATE SEQUENCE call_score_comment_call__score_comment_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE call_score_criteria_review_call_score_criteria_review_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE TABLE public.call_score_criteria_review
(
  call_score_criteria_review_id integer NOT NULL DEFAULT nextval('call_score_criteria_review_call_score_criteria_review_id_seq'::regclass),
  call_score_card_id integer NOT NULL,
  score_card_id integer NOT NULL,
  criteria_answer integer NULL,
  CONSTRAINT call_score_criteria_review_pkey PRIMARY KEY (call_score_criteria_review_id),
  CONSTRAINT call_score_criteria_review_call_score_card_id_fkey FOREIGN KEY (call_score_card_id)
      REFERENCES public.call_score_card (call_score_card_id) MATCH SIMPLE
      ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT call_score_criteria_review_score_card_id_fkey FOREIGN KEY (score_card_id)
      REFERENCES public.score_card (score_card_id) MATCH SIMPLE
      ON UPDATE CASCADE ON DELETE CASCADE
);
