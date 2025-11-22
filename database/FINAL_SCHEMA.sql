


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


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."calculate_portfolio_duration"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF NEW.start_date IS NOT NULL AND NEW.end_date IS NOT NULL THEN
        NEW.duration_days = NEW.end_date - NEW.start_date;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."calculate_portfolio_duration"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_notification"("p_user_id" "uuid", "p_type" "text", "p_title" "text", "p_message" "text", "p_link" "text" DEFAULT NULL::"text", "p_data" "jsonb" DEFAULT NULL::"jsonb", "p_priority" "text" DEFAULT 'normal'::"text") RETURNS "uuid"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO notifications (
        user_id, type, title, message, link, data, priority
    ) VALUES (
        p_user_id, p_type, p_title, p_message, p_link, p_data, p_priority
    )
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$;


ALTER FUNCTION "public"."create_notification"("p_user_id" "uuid", "p_type" "text", "p_title" "text", "p_message" "text", "p_link" "text", "p_data" "jsonb", "p_priority" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."create_notification"("p_user_id" "uuid", "p_type" "text", "p_title" "text", "p_message" "text", "p_link" "text", "p_data" "jsonb", "p_priority" "text") IS 'Helper function to create a new notification';



CREATE OR REPLACE FUNCTION "public"."custom_access_token_hook"("event" "jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  claims jsonb;
  user_role text;
BEGIN
  -- Pobierz rolę użytkownika z tabeli profiles
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = (event->>'user_id')::uuid;

  -- Dodaj rolę do claims
  claims := event->'claims';
  
  IF user_role IS NOT NULL THEN
    claims := jsonb_set(claims, '{role}', to_jsonb(user_role));
  END IF;

  -- Zwróć event z zaktualizowanymi claims
  event := jsonb_set(event, '{claims}', claims);
  
  RETURN event;
END;
$$;


ALTER FUNCTION "public"."custom_access_token_hook"("event" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_certificate_number"() RETURNS "text"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
DECLARE
  year_part TEXT;
  sequence_part TEXT;
  next_number INTEGER;
BEGIN
  year_part := TO_CHAR(NOW(), 'YYYY');
  
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(certificate_number FROM 10) AS INTEGER)
  ), 0) + 1
  INTO next_number
  FROM zzp_exam_applications
  WHERE certificate_number LIKE 'ZZP-' || year_part || '-%';
  
  sequence_part := LPAD(next_number::TEXT, 5, '0');
  
  RETURN 'ZZP-' || year_part || '-' || sequence_part;
END;
$$;


ALTER FUNCTION "public"."generate_certificate_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_unread_message_count"("user_id" "uuid") RETURNS integer
    LANGUAGE "sql" STABLE
    AS $$
    SELECT COUNT(*)::INTEGER
    FROM messages
    WHERE recipient_id = user_id
    AND read = false;
$$;


ALTER FUNCTION "public"."get_unread_message_count"("user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_unread_message_count"("user_id" "uuid") IS 'Get count of unread messages for a user';



CREATE OR REPLACE FUNCTION "public"."get_unread_notifications_count"("p_user_id" "uuid") RETURNS integer
    LANGUAGE "sql" STABLE
    AS $$
    SELECT COUNT(*)::INTEGER
    FROM notifications
    WHERE user_id = p_user_id
    AND read = false
    AND (expires_at IS NULL OR expires_at > NOW());
$$;


ALTER FUNCTION "public"."get_unread_notifications_count"("p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_unread_notifications_count"("p_user_id" "uuid") IS 'Get count of unread notifications for a user';



CREATE OR REPLACE FUNCTION "public"."get_worker_earnings_stats"("p_worker_id" "uuid") RETURNS TABLE("total_earnings" numeric, "paid_earnings" numeric, "pending_earnings" numeric, "total_jobs" integer)
    LANGUAGE "plpgsql" STABLE
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(SUM(amount), 0) as total_earnings,
        COALESCE(SUM(amount) FILTER (WHERE status = 'paid'), 0) as paid_earnings,
        COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0) as pending_earnings,
        COUNT(DISTINCT job_id)::INTEGER as total_jobs
    FROM earnings
    WHERE worker_id = p_worker_id;
END;
$$;


ALTER FUNCTION "public"."get_worker_earnings_stats"("p_worker_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_worker_earnings_stats"("p_worker_id" "uuid") IS 'Get earnings statistics for a worker';



CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  -- Profil (id = auth.users.id)
  insert into public.profiles (id, email, full_name, created_at)
  values (new.id, new.email, coalesce(split_part(new.email,'@',1), 'user'), now())
  on conflict (id) do nothing;

  -- Domyślna rola
  insert into public.user_roles (user_id, role)
  values (new.id, 'worker')
  on conflict (user_id) do nothing;

  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."initialize_employer_stats"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    INSERT INTO employer_stats (employer_id)
    VALUES (NEW.id)
    ON CONFLICT (employer_id) DO NOTHING;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."initialize_employer_stats"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_subscription_event"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.subscription_events (worker_id, event_type, event_data)
    VALUES (NEW.worker_id, 'payment_succeeded', jsonb_build_object(
      'amount', NEW.amount,
      'payment_id', NEW.id,
      'period_start', NEW.period_start,
      'period_end', NEW.period_end
    ));
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."log_subscription_event"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_message_as_read"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF NEW.read = true AND OLD.read = false THEN
        NEW.read_at = NOW();
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."mark_message_as_read"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."mark_notification_as_read"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF NEW.is_read = true AND OLD.is_read = false THEN
        NEW.read_at = NOW();
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."mark_notification_as_read"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_applications_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_applications_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_employer_stats"("p_employer_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  INSERT INTO employer_stats (employer_id, total_searches, total_saved_workers)
  VALUES (p_employer_id, 0, 0)
  ON CONFLICT (employer_id) DO NOTHING;
END;
$$;


ALTER FUNCTION "public"."update_employer_stats"("p_employer_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_employer_stats_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_employer_stats_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_employers_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_employers_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_entity_ratings"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    avg_rating NUMERIC(3,2);
    review_count INTEGER;
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- Update worker rating if reviewee is a worker
        IF EXISTS (SELECT 1 FROM workers WHERE profile_id = NEW.reviewee_id) THEN
            SELECT AVG(rating), COUNT(*)
            INTO avg_rating, review_count
            FROM reviews
            WHERE reviewee_id = NEW.reviewee_id
            AND status = 'approved';
            
            UPDATE workers
            SET rating = COALESCE(avg_rating, 0),
                rating_count = review_count
            WHERE profile_id = NEW.reviewee_id;
        END IF;
        
        -- Update employer rating if reviewee is an employer
        IF EXISTS (SELECT 1 FROM employers WHERE profile_id = NEW.reviewee_id) THEN
            SELECT AVG(rating), COUNT(*)
            INTO avg_rating, review_count
            FROM reviews
            WHERE reviewee_id = NEW.reviewee_id
            AND status = 'approved';
            
            UPDATE employers
            SET avg_rating = COALESCE(avg_rating, 0)
            WHERE profile_id = NEW.reviewee_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_entity_ratings"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_job_applications_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE jobs
        SET applications_count = applications_count + 1
        WHERE id = NEW.job_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE jobs
        SET applications_count = applications_count - 1
        WHERE id = OLD.job_id AND applications_count > 0;
    END IF;
    RETURN NULL;
END;
$$;


ALTER FUNCTION "public"."update_job_applications_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_reviews_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_reviews_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
  BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
  END;
  $$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_worker_portfolio_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_worker_portfolio_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_worker_skills_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_worker_skills_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_workers_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_workers_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_zzp_exam_timestamp"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public', 'pg_temp'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_zzp_exam_timestamp"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."admin_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "admin_id" "uuid",
    "action" "text" NOT NULL,
    "target_type" "text",
    "target_id" "uuid",
    "details" "jsonb",
    "ip_address" "inet",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."admin_logs" OWNER TO "postgres";


COMMENT ON TABLE "public"."admin_logs" IS 'Administrative action audit logs';



CREATE TABLE IF NOT EXISTS "public"."analytics_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "event_type" "text" NOT NULL,
    "event_name" "text" NOT NULL,
    "properties" "jsonb",
    "session_id" "text",
    "ip_address" "inet",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."analytics_events" OWNER TO "postgres";


COMMENT ON TABLE "public"."analytics_events" IS 'User behavior analytics events';



CREATE TABLE IF NOT EXISTS "public"."applications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "job_id" "uuid" NOT NULL,
    "worker_id" "uuid" NOT NULL,
    "employer_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text",
    "cover_letter" "text",
    "proposed_rate" numeric(10,2),
    "available_from" "date",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "reviewed_at" timestamp with time zone,
    CONSTRAINT "applications_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'shortlisted'::"text", 'accepted'::"text", 'rejected'::"text", 'withdrawn'::"text"])))
);


ALTER TABLE "public"."applications" OWNER TO "postgres";


COMMENT ON TABLE "public"."applications" IS 'Job applications from workers to employers';



COMMENT ON COLUMN "public"."applications"."status" IS 'Application status: pending, shortlisted, accepted, rejected, or withdrawn';



COMMENT ON COLUMN "public"."applications"."proposed_rate" IS 'Worker proposed hourly rate for this job';



COMMENT ON COLUMN "public"."applications"."available_from" IS 'When the worker can start working';



CREATE TABLE IF NOT EXISTS "public"."certificates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "worker_id" "uuid" NOT NULL,
    "certificate_type" "text" NOT NULL,
    "certificate_name" "text" NOT NULL,
    "certificate_number" "text",
    "issuer" "text",
    "issue_date" "date",
    "expiry_date" "date",
    "file_url" "text",
    "verified" boolean DEFAULT false,
    "verified_by" "uuid",
    "verified_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."certificates" OWNER TO "postgres";


COMMENT ON TABLE "public"."certificates" IS 'Worker certificates and qualifications';



CREATE TABLE IF NOT EXISTS "public"."earnings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "worker_id" "uuid" NOT NULL,
    "job_id" "uuid",
    "employer_id" "uuid",
    "amount" numeric(10,2) NOT NULL,
    "currency" "text" DEFAULT 'EUR'::"text",
    "payment_date" "date" NOT NULL,
    "payment_method" "text",
    "invoice_number" "text",
    "status" "text" DEFAULT 'pending'::"text",
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "earnings_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'paid'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."earnings" OWNER TO "postgres";


COMMENT ON TABLE "public"."earnings" IS 'Worker earnings and payment tracking';



CREATE TABLE IF NOT EXISTS "public"."employer_saved_workers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employer_id" "uuid" NOT NULL,
    "worker_id" "uuid" NOT NULL,
    "notes" "text",
    "tags" "text"[],
    "folder" "text",
    "saved_at" timestamp with time zone DEFAULT "now"(),
    "last_viewed_at" timestamp with time zone
);


ALTER TABLE "public"."employer_saved_workers" OWNER TO "postgres";


COMMENT ON TABLE "public"."employer_saved_workers" IS 'Employers saved/bookmarked workers';



COMMENT ON COLUMN "public"."employer_saved_workers"."notes" IS 'Private notes about this worker';



COMMENT ON COLUMN "public"."employer_saved_workers"."tags" IS 'Custom tags for organization';



COMMENT ON COLUMN "public"."employer_saved_workers"."folder" IS 'Folder/category for organization';



CREATE TABLE IF NOT EXISTS "public"."employer_search_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employer_id" "uuid" NOT NULL,
    "search_date" timestamp with time zone DEFAULT "now"(),
    "category" "text",
    "subcategory" "text",
    "level" "text",
    "location_city" "text",
    "radius_km" integer,
    "min_rate" numeric(10,2),
    "max_rate" numeric(10,2),
    "skills" "text"[],
    "results_count" integer,
    "filters" "jsonb"
);


ALTER TABLE "public"."employer_search_history" OWNER TO "postgres";


COMMENT ON TABLE "public"."employer_search_history" IS 'Employer search history for analytics';



CREATE TABLE IF NOT EXISTS "public"."employer_stats" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employer_id" "uuid" NOT NULL,
    "total_searches" integer DEFAULT 0,
    "searches_this_month" integer DEFAULT 0,
    "searches_this_week" integer DEFAULT 0,
    "last_search_at" timestamp with time zone,
    "total_saved_workers" integer DEFAULT 0,
    "total_contacts" integer DEFAULT 0,
    "contacts_this_month" integer DEFAULT 0,
    "contacts_this_week" integer DEFAULT 0,
    "last_contact_at" timestamp with time zone,
    "total_jobs_posted" integer DEFAULT 0,
    "active_jobs" integer DEFAULT 0,
    "filled_jobs" integer DEFAULT 0,
    "total_applications_received" integer DEFAULT 0,
    "pending_applications" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."employer_stats" OWNER TO "postgres";


COMMENT ON TABLE "public"."employer_stats" IS 'Statistics and metrics for employer dashboard';



COMMENT ON COLUMN "public"."employer_stats"."searches_this_month" IS 'Number of worker searches this month';



COMMENT ON COLUMN "public"."employer_stats"."contacts_this_month" IS 'Number of workers contacted this month';



CREATE TABLE IF NOT EXISTS "public"."employers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "company_name" "text",
    "kvk_number" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "subscription_tier" "text" DEFAULT 'basic'::"text",
    "subscription_status" "text" DEFAULT 'inactive'::"text",
    "subscription_started_at" timestamp with time zone,
    "subscription_expires_at" timestamp with time zone,
    "logo_url" "text",
    "website" "text",
    "description" "text",
    "industry" "text",
    "company_size" "text",
    "address" "text",
    "city" "text",
    "postal_code" "text",
    "country" "text" DEFAULT 'NL'::"text",
    "contact_person" "text",
    "contact_phone" "text",
    "contact_email" "text",
    "verified" boolean DEFAULT false,
    "verified_at" timestamp with time zone,
    "total_jobs_posted" integer DEFAULT 0,
    "total_hires" integer DEFAULT 0,
    "avg_rating" numeric(3,2) DEFAULT 0,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "employers_avg_rating_check" CHECK ((("avg_rating" >= (0)::numeric) AND ("avg_rating" <= (5)::numeric))),
    CONSTRAINT "employers_company_size_check" CHECK (("company_size" = ANY (ARRAY['1-10'::"text", '11-50'::"text", '51-200'::"text", '201-500'::"text", '500+'::"text"]))),
    CONSTRAINT "employers_subscription_status_check" CHECK (("subscription_status" = ANY (ARRAY['active'::"text", 'inactive'::"text", 'cancelled'::"text", 'expired'::"text"]))),
    CONSTRAINT "employers_subscription_tier_check" CHECK (("subscription_tier" = ANY (ARRAY['basic'::"text", 'premium'::"text", 'enterprise'::"text"])))
);


ALTER TABLE "public"."employers" OWNER TO "postgres";


COMMENT ON TABLE "public"."employers" IS 'Extended employer profiles with complete company information';



COMMENT ON COLUMN "public"."employers"."subscription_tier" IS 'Subscription plan: basic, premium, or enterprise';



COMMENT ON COLUMN "public"."employers"."subscription_status" IS 'Current subscription status: active, inactive, cancelled, or expired';



COMMENT ON COLUMN "public"."employers"."subscription_started_at" IS 'When the current subscription period started';



COMMENT ON COLUMN "public"."employers"."subscription_expires_at" IS 'When the current subscription expires';



COMMENT ON COLUMN "public"."employers"."company_size" IS 'Company size category: 1-10, 11-50, 51-200, 201-500, or 500+';



COMMENT ON COLUMN "public"."employers"."verified" IS 'Whether the company has been verified by platform';



COMMENT ON COLUMN "public"."employers"."total_jobs_posted" IS 'Total number of jobs posted by this employer';



COMMENT ON COLUMN "public"."employers"."total_hires" IS 'Total number of successful hires made';



COMMENT ON COLUMN "public"."employers"."avg_rating" IS 'Average rating from workers (0-5)';



CREATE TABLE IF NOT EXISTS "public"."jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "employer_id" "uuid" NOT NULL,
    "title" character varying(255) NOT NULL,
    "description" "text" NOT NULL,
    "short_description" "text",
    "category" character varying(100),
    "subcategory" character varying(100),
    "location" character varying(255),
    "location_type" character varying(20),
    "address" "text",
    "postal_code" character varying(20),
    "city" character varying(100),
    "country" character varying(2) DEFAULT 'NL'::character varying,
    "latitude" numeric(10,8),
    "longitude" numeric(11,8),
    "salary_min" numeric(10,2),
    "salary_max" numeric(10,2),
    "salary_currency" character varying(3) DEFAULT 'EUR'::character varying,
    "salary_period" character varying(20),
    "salary_visible" boolean DEFAULT true,
    "employment_type" character varying(50),
    "experience_level" character varying(50),
    "education_level" character varying(50),
    "contract_duration_months" integer,
    "hours_per_week" integer,
    "start_date" "date",
    "required_skills" "text"[],
    "required_certificates" "text"[],
    "preferred_skills" "text"[],
    "languages" "text"[],
    "benefits" "text"[],
    "status" character varying(20) DEFAULT 'draft'::character varying,
    "published_at" timestamp with time zone,
    "expires_at" timestamp with time zone,
    "filled_at" timestamp with time zone,
    "views_count" integer DEFAULT 0,
    "applications_count" integer DEFAULT 0,
    "urgent" boolean DEFAULT false,
    "featured" boolean DEFAULT false,
    "allow_messages" boolean DEFAULT true,
    "application_url" "text",
    "company_logo_url" "text",
    "tags" "text"[],
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "jobs_contract_duration_months_check" CHECK (("contract_duration_months" >= 0)),
    CONSTRAINT "jobs_education_level_check" CHECK ((("education_level")::"text" = ANY ((ARRAY['none'::character varying, 'high-school'::character varying, 'vocational'::character varying, 'bachelor'::character varying, 'master'::character varying, 'phd'::character varying])::"text"[]))),
    CONSTRAINT "jobs_employment_type_check" CHECK ((("employment_type")::"text" = ANY ((ARRAY['full-time'::character varying, 'part-time'::character varying, 'contract'::character varying, 'freelance'::character varying, 'temporary'::character varying, 'internship'::character varying])::"text"[]))),
    CONSTRAINT "jobs_experience_level_check" CHECK ((("experience_level")::"text" = ANY ((ARRAY['entry'::character varying, 'junior'::character varying, 'mid'::character varying, 'senior'::character varying, 'expert'::character varying, 'any'::character varying])::"text"[]))),
    CONSTRAINT "jobs_hours_per_week_check" CHECK ((("hours_per_week" >= 0) AND ("hours_per_week" <= 168))),
    CONSTRAINT "jobs_location_type_check" CHECK ((("location_type")::"text" = ANY ((ARRAY['on-site'::character varying, 'remote'::character varying, 'hybrid'::character varying])::"text"[]))),
    CONSTRAINT "jobs_salary_period_check" CHECK ((("salary_period")::"text" = ANY ((ARRAY['hour'::character varying, 'day'::character varying, 'week'::character varying, 'month'::character varying, 'year'::character varying, 'project'::character varying])::"text"[]))),
    CONSTRAINT "jobs_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['draft'::character varying, 'active'::character varying, 'paused'::character varying, 'closed'::character varying, 'filled'::character varying, 'expired'::character varying])::"text"[])))
);


ALTER TABLE "public"."jobs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sender_id" "uuid" NOT NULL,
    "recipient_id" "uuid" NOT NULL,
    "subject" "text",
    "content" "text" NOT NULL,
    "read" boolean DEFAULT false,
    "read_at" timestamp with time zone,
    "job_id" "uuid",
    "attachments" "text"[],
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."messages" OWNER TO "postgres";


COMMENT ON TABLE "public"."messages" IS 'Messaging system between users (workers, employers, admins)';



COMMENT ON COLUMN "public"."messages"."read" IS 'Whether the recipient has read this message';



COMMENT ON COLUMN "public"."messages"."job_id" IS 'Optional reference to related job posting';



COMMENT ON COLUMN "public"."messages"."attachments" IS 'Array of attachment URLs';



CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "message" "text" NOT NULL,
    "link" "text",
    "data" "jsonb",
    "read" boolean DEFAULT false,
    "read_at" timestamp with time zone,
    "priority" "text" DEFAULT 'normal'::"text",
    "sent_email" boolean DEFAULT false,
    "sent_sms" boolean DEFAULT false,
    "sent_push" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone,
    CONSTRAINT "notifications_priority_check" CHECK (("priority" = ANY (ARRAY['low'::"text", 'normal'::"text", 'high'::"text", 'urgent'::"text"])))
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


COMMENT ON TABLE "public"."notifications" IS 'User notifications system';



COMMENT ON COLUMN "public"."notifications"."type" IS 'Notification type (e.g. NEW_JOB, NEW_APPLICATION, NEW_MESSAGE)';



COMMENT ON COLUMN "public"."notifications"."data" IS 'Additional structured data in JSON format';



COMMENT ON COLUMN "public"."notifications"."priority" IS 'Priority level: low, normal, high, or urgent';



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "full_name" "text",
    "role" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "profiles_role_check" CHECK (("role" = ANY (ARRAY['worker'::"text", 'employer'::"text", 'admin'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reviews" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "job_id" "uuid",
    "worker_id" "uuid",
    "employer_id" "uuid",
    "reviewer_id" "uuid" NOT NULL,
    "reviewee_id" "uuid" NOT NULL,
    "rating" integer NOT NULL,
    "comment" "text",
    "quality_rating" integer,
    "punctuality_rating" integer,
    "communication_rating" integer,
    "safety_rating" integer,
    "photos" "text"[],
    "would_recommend" boolean DEFAULT true,
    "status" "text" DEFAULT 'pending'::"text",
    "verified_by_platform" boolean DEFAULT false,
    "reviewed_by_admin" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "approved_at" timestamp with time zone,
    CONSTRAINT "reviews_communication_rating_check" CHECK ((("communication_rating" >= 1) AND ("communication_rating" <= 5))),
    CONSTRAINT "reviews_punctuality_rating_check" CHECK ((("punctuality_rating" >= 1) AND ("punctuality_rating" <= 5))),
    CONSTRAINT "reviews_quality_rating_check" CHECK ((("quality_rating" >= 1) AND ("quality_rating" <= 5))),
    CONSTRAINT "reviews_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5))),
    CONSTRAINT "reviews_safety_rating_check" CHECK ((("safety_rating" >= 1) AND ("safety_rating" <= 5))),
    CONSTRAINT "reviews_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text", 'hidden'::"text"])))
);


ALTER TABLE "public"."reviews" OWNER TO "postgres";


COMMENT ON TABLE "public"."reviews" IS 'Reviews and ratings for workers and employers';



COMMENT ON COLUMN "public"."reviews"."status" IS 'Review status: pending, approved, rejected, or hidden';



COMMENT ON COLUMN "public"."reviews"."verified_by_platform" IS 'Whether this review has been verified as genuine';



CREATE OR REPLACE VIEW "public"."v_employers" WITH ("security_invoker"='on') AS
 SELECT "id",
    "profile_id",
    "company_name",
    "kvk_number",
    "created_at"
   FROM "public"."employers";


ALTER VIEW "public"."v_employers" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."v_profiles" WITH ("security_invoker"='on') AS
 SELECT "id",
    "email",
    "full_name",
    "role",
    "created_at"
   FROM "public"."profiles";


ALTER VIEW "public"."v_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."workers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "specialization" "text",
    "experience_years" integer,
    "verified" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "subscription_tier" "text" DEFAULT 'basic'::"text",
    "subscription_status" "text" DEFAULT 'active'::"text",
    "subscription_start_date" timestamp with time zone DEFAULT "now"(),
    "subscription_end_date" timestamp with time zone,
    "last_payment_date" timestamp with time zone,
    "monthly_fee" numeric(10,2) DEFAULT 13.00,
    "stripe_customer_id" "text",
    "stripe_subscription_id" "text",
    "zzp_certificate_issued" boolean DEFAULT false,
    "zzp_certificate_date" timestamp with time zone,
    "zzp_certificate_number" "text",
    "zzp_certificate_expires_at" timestamp with time zone,
    "certifications" "text"[] DEFAULT '{}'::"text"[],
    "avatar_url" "text",
    "phone" "text",
    "location_city" "text",
    "location_postal_code" "text",
    "location_country" "text" DEFAULT 'NL'::"text",
    "hourly_rate" numeric(10,2) DEFAULT 0,
    "hourly_rate_max" numeric(10,2),
    "radius_km" integer DEFAULT 50,
    "available_from" "date",
    "rating" numeric(3,2) DEFAULT 0,
    "rating_count" integer DEFAULT 0,
    "bio" "text",
    "languages" "text"[] DEFAULT '{nl}'::"text"[],
    "kvk_number" "text",
    "btw_number" "text",
    "profile_visibility" "text" DEFAULT 'public'::"text",
    "show_email" boolean DEFAULT false,
    "show_phone" boolean DEFAULT false,
    "show_location" boolean DEFAULT true,
    "email_notifications" boolean DEFAULT true,
    "sms_notifications" boolean DEFAULT false,
    "push_notifications" boolean DEFAULT true,
    "own_tools" "text"[] DEFAULT '{}'::"text"[],
    "own_vehicle" boolean DEFAULT false,
    "vehicle_type" "text",
    "response_time" "text",
    "total_jobs_completed" integer DEFAULT 0,
    "profile_views" integer DEFAULT 0,
    "last_active" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "workers_experience_years_check" CHECK (("experience_years" >= 0)),
    CONSTRAINT "workers_profile_visibility_check" CHECK (("profile_visibility" = ANY (ARRAY['public'::"text", 'contacts'::"text", 'private'::"text"]))),
    CONSTRAINT "workers_rating_check" CHECK ((("rating" >= (0)::numeric) AND ("rating" <= (5)::numeric))),
    CONSTRAINT "workers_subscription_status_check" CHECK (("subscription_status" = ANY (ARRAY['active'::"text", 'cancelled'::"text", 'expired'::"text", 'trial'::"text"]))),
    CONSTRAINT "workers_subscription_tier_check" CHECK (("subscription_tier" = ANY (ARRAY['basic'::"text", 'premium'::"text"])))
);


ALTER TABLE "public"."workers" OWNER TO "postgres";


COMMENT ON TABLE "public"."workers" IS 'Extended worker profiles with complete information for Worker Dashboard';



COMMENT ON COLUMN "public"."workers"."hourly_rate" IS 'Base hourly rate in EUR';



COMMENT ON COLUMN "public"."workers"."hourly_rate_max" IS 'Maximum hourly rate in EUR (for range display)';



COMMENT ON COLUMN "public"."workers"."radius_km" IS 'Willing to travel distance in kilometers';



COMMENT ON COLUMN "public"."workers"."rating" IS 'Average rating (0-5)';



COMMENT ON COLUMN "public"."workers"."rating_count" IS 'Total number of ratings received';



COMMENT ON COLUMN "public"."workers"."profile_visibility" IS 'Profile visibility: public, contacts, or private';



CREATE OR REPLACE VIEW "public"."v_workers" WITH ("security_invoker"='on') AS
 SELECT "id",
    "profile_id",
    "specialization",
    "experience_years",
    "verified",
    "created_at"
   FROM "public"."workers";


ALTER VIEW "public"."v_workers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."worker_availability" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "worker_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "start_time" time without time zone,
    "end_time" time without time zone,
    "is_booked" boolean DEFAULT false,
    "booking_job_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."worker_availability" OWNER TO "postgres";


COMMENT ON TABLE "public"."worker_availability" IS 'Worker availability calendar';



CREATE TABLE IF NOT EXISTS "public"."worker_portfolio" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "worker_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "project_url" "text",
    "images" "text"[],
    "video_url" "text",
    "tags" "text"[],
    "category" "text",
    "start_date" "date",
    "end_date" "date",
    "duration_days" integer,
    "client_name" "text",
    "client_company" "text",
    "is_featured" boolean DEFAULT false,
    "is_public" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."worker_portfolio" OWNER TO "postgres";


COMMENT ON TABLE "public"."worker_portfolio" IS 'Worker portfolio/project showcase';



COMMENT ON COLUMN "public"."worker_portfolio"."duration_days" IS 'Project duration in days (auto-calculated)';



COMMENT ON COLUMN "public"."worker_portfolio"."is_featured" IS 'Whether this project is featured on worker profile';



COMMENT ON COLUMN "public"."worker_portfolio"."is_public" IS 'Whether this project is visible to public';



CREATE TABLE IF NOT EXISTS "public"."worker_skills" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "worker_id" "uuid" NOT NULL,
    "skill_name" "text" NOT NULL,
    "proficiency" integer,
    "years_experience" integer,
    "verified" boolean DEFAULT false,
    "verified_by" "uuid",
    "verified_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "worker_skills_proficiency_check" CHECK ((("proficiency" >= 1) AND ("proficiency" <= 5))),
    CONSTRAINT "worker_skills_years_experience_check" CHECK (("years_experience" >= 0))
);


ALTER TABLE "public"."worker_skills" OWNER TO "postgres";


COMMENT ON TABLE "public"."worker_skills" IS 'Worker skills with proficiency levels and verification status';



COMMENT ON COLUMN "public"."worker_skills"."proficiency" IS 'Skill proficiency level: 1 (beginner) to 5 (expert)';



COMMENT ON COLUMN "public"."worker_skills"."years_experience" IS 'Years of experience with this specific skill';



COMMENT ON COLUMN "public"."worker_skills"."verified" IS 'Whether this skill has been verified by platform';



ALTER TABLE ONLY "public"."admin_logs"
    ADD CONSTRAINT "admin_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."analytics_events"
    ADD CONSTRAINT "analytics_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."applications"
    ADD CONSTRAINT "applications_job_id_worker_id_key" UNIQUE ("job_id", "worker_id");



ALTER TABLE ONLY "public"."applications"
    ADD CONSTRAINT "applications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."certificates"
    ADD CONSTRAINT "certificates_certificate_number_key" UNIQUE ("certificate_number");



ALTER TABLE ONLY "public"."certificates"
    ADD CONSTRAINT "certificates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."earnings"
    ADD CONSTRAINT "earnings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."employer_saved_workers"
    ADD CONSTRAINT "employer_saved_workers_employer_id_worker_id_key" UNIQUE ("employer_id", "worker_id");



ALTER TABLE ONLY "public"."employer_saved_workers"
    ADD CONSTRAINT "employer_saved_workers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."employer_search_history"
    ADD CONSTRAINT "employer_search_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."employer_stats"
    ADD CONSTRAINT "employer_stats_employer_id_key" UNIQUE ("employer_id");



ALTER TABLE ONLY "public"."employer_stats"
    ADD CONSTRAINT "employer_stats_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."employers"
    ADD CONSTRAINT "employers_kvk_number_key" UNIQUE ("kvk_number");



ALTER TABLE ONLY "public"."employers"
    ADD CONSTRAINT "employers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."jobs"
    ADD CONSTRAINT "jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_job_id_reviewer_id_reviewee_id_key" UNIQUE ("job_id", "reviewer_id", "reviewee_id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."worker_availability"
    ADD CONSTRAINT "worker_availability_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."worker_availability"
    ADD CONSTRAINT "worker_availability_worker_id_date_start_time_key" UNIQUE ("worker_id", "date", "start_time");



ALTER TABLE ONLY "public"."worker_portfolio"
    ADD CONSTRAINT "worker_portfolio_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."worker_skills"
    ADD CONSTRAINT "worker_skills_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."worker_skills"
    ADD CONSTRAINT "worker_skills_worker_id_skill_name_key" UNIQUE ("worker_id", "skill_name");



ALTER TABLE ONLY "public"."workers"
    ADD CONSTRAINT "workers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."workers"
    ADD CONSTRAINT "workers_stripe_customer_id_key" UNIQUE ("stripe_customer_id");



ALTER TABLE ONLY "public"."workers"
    ADD CONSTRAINT "workers_stripe_subscription_id_key" UNIQUE ("stripe_subscription_id");



ALTER TABLE ONLY "public"."workers"
    ADD CONSTRAINT "workers_zzp_certificate_number_key" UNIQUE ("zzp_certificate_number");



CREATE UNIQUE INDEX "employers_profile_id_key" ON "public"."employers" USING "btree" ("profile_id");



CREATE UNIQUE INDEX "employers_website_key" ON "public"."employers" USING "btree" ("website") WHERE ("website" IS NOT NULL);



CREATE INDEX "idx_admin_logs_action" ON "public"."admin_logs" USING "btree" ("action");



CREATE INDEX "idx_admin_logs_admin" ON "public"."admin_logs" USING "btree" ("admin_id", "created_at" DESC);



CREATE INDEX "idx_admin_logs_target" ON "public"."admin_logs" USING "btree" ("target_type", "target_id");



CREATE INDEX "idx_analytics_events_session" ON "public"."analytics_events" USING "btree" ("session_id");



CREATE INDEX "idx_analytics_events_type" ON "public"."analytics_events" USING "btree" ("event_type", "event_name");



CREATE INDEX "idx_analytics_events_user" ON "public"."analytics_events" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_applications_created" ON "public"."applications" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_applications_employer" ON "public"."applications" USING "btree" ("employer_id", "status");



CREATE INDEX "idx_applications_job" ON "public"."applications" USING "btree" ("job_id", "status");



CREATE INDEX "idx_applications_worker" ON "public"."applications" USING "btree" ("worker_id", "status");



CREATE INDEX "idx_certificates_expiry" ON "public"."certificates" USING "btree" ("expiry_date");



CREATE INDEX "idx_certificates_verified" ON "public"."certificates" USING "btree" ("verified");



CREATE INDEX "idx_certificates_worker" ON "public"."certificates" USING "btree" ("worker_id");



CREATE INDEX "idx_earnings_status" ON "public"."earnings" USING "btree" ("status");



CREATE INDEX "idx_earnings_worker" ON "public"."earnings" USING "btree" ("worker_id", "payment_date" DESC);



CREATE INDEX "idx_employer_saved_workers_employer" ON "public"."employer_saved_workers" USING "btree" ("employer_id", "saved_at" DESC);



CREATE INDEX "idx_employer_saved_workers_tags" ON "public"."employer_saved_workers" USING "gin" ("tags");



CREATE INDEX "idx_employer_saved_workers_worker" ON "public"."employer_saved_workers" USING "btree" ("worker_id");



CREATE INDEX "idx_employer_search_history_employer" ON "public"."employer_search_history" USING "btree" ("employer_id", "search_date" DESC);



CREATE INDEX "idx_employer_stats_employer" ON "public"."employer_stats" USING "btree" ("employer_id");



CREATE INDEX "idx_employers_city" ON "public"."employers" USING "btree" ("city");



CREATE INDEX "idx_employers_industry" ON "public"."employers" USING "btree" ("industry");



CREATE INDEX "idx_employers_subscription" ON "public"."employers" USING "btree" ("subscription_status", "subscription_expires_at");



CREATE INDEX "idx_employers_verified" ON "public"."employers" USING "btree" ("verified") WHERE ("verified" = true);



CREATE INDEX "idx_jobs_category" ON "public"."jobs" USING "btree" ("category");



CREATE INDEX "idx_jobs_created_at" ON "public"."jobs" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_jobs_description_search" ON "public"."jobs" USING "gin" ("to_tsvector"('"english"'::"regconfig", "description"));



CREATE INDEX "idx_jobs_employer_id" ON "public"."jobs" USING "btree" ("employer_id");



CREATE INDEX "idx_jobs_employment_type" ON "public"."jobs" USING "btree" ("employment_type");



CREATE INDEX "idx_jobs_expires_at" ON "public"."jobs" USING "btree" ("expires_at");



CREATE INDEX "idx_jobs_featured" ON "public"."jobs" USING "btree" ("featured") WHERE ("featured" = true);



CREATE INDEX "idx_jobs_location" ON "public"."jobs" USING "btree" ("city", "country");



CREATE INDEX "idx_jobs_location_type" ON "public"."jobs" USING "btree" ("location_type");



CREATE INDEX "idx_jobs_published_at" ON "public"."jobs" USING "btree" ("published_at" DESC);



CREATE INDEX "idx_jobs_required_skills" ON "public"."jobs" USING "gin" ("required_skills") WHERE ("required_skills" IS NOT NULL);



CREATE INDEX "idx_jobs_salary" ON "public"."jobs" USING "btree" ("salary_min", "salary_max") WHERE ("salary_visible" = true);



CREATE INDEX "idx_jobs_status" ON "public"."jobs" USING "btree" ("status");



CREATE INDEX "idx_jobs_tags" ON "public"."jobs" USING "gin" ("tags") WHERE ("tags" IS NOT NULL);



CREATE INDEX "idx_jobs_title_search" ON "public"."jobs" USING "gin" ("to_tsvector"('"english"'::"regconfig", ("title")::"text"));



CREATE INDEX "idx_jobs_urgent" ON "public"."jobs" USING "btree" ("urgent") WHERE ("urgent" = true);



CREATE INDEX "idx_messages_conversation" ON "public"."messages" USING "btree" ("sender_id", "recipient_id", "created_at" DESC);



CREATE INDEX "idx_messages_job" ON "public"."messages" USING "btree" ("job_id") WHERE ("job_id" IS NOT NULL);



CREATE INDEX "idx_messages_recipient" ON "public"."messages" USING "btree" ("recipient_id", "created_at" DESC);



CREATE INDEX "idx_messages_sender" ON "public"."messages" USING "btree" ("sender_id", "created_at" DESC);



CREATE INDEX "idx_messages_unread" ON "public"."messages" USING "btree" ("recipient_id", "read") WHERE ("read" = false);



CREATE INDEX "idx_notifications_priority" ON "public"."notifications" USING "btree" ("priority") WHERE ("priority" = ANY (ARRAY['high'::"text", 'urgent'::"text"]));



CREATE INDEX "idx_notifications_type" ON "public"."notifications" USING "btree" ("type");



CREATE INDEX "idx_notifications_unread" ON "public"."notifications" USING "btree" ("user_id", "read") WHERE ("read" = false);



CREATE INDEX "idx_notifications_user" ON "public"."notifications" USING "btree" ("user_id", "created_at" DESC);



CREATE INDEX "idx_profiles_email" ON "public"."profiles" USING "btree" ("email");



CREATE INDEX "idx_profiles_role" ON "public"."profiles" USING "btree" ("role");



CREATE INDEX "idx_reviews_created" ON "public"."reviews" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_reviews_employer" ON "public"."reviews" USING "btree" ("employer_id", "status");



CREATE INDEX "idx_reviews_rating" ON "public"."reviews" USING "btree" ("rating" DESC);



CREATE INDEX "idx_reviews_status" ON "public"."reviews" USING "btree" ("status");



CREATE INDEX "idx_reviews_worker" ON "public"."reviews" USING "btree" ("worker_id", "status");



CREATE INDEX "idx_worker_availability_date" ON "public"."worker_availability" USING "btree" ("date");



CREATE INDEX "idx_worker_availability_worker" ON "public"."worker_availability" USING "btree" ("worker_id", "date");



CREATE INDEX "idx_worker_portfolio_created" ON "public"."worker_portfolio" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_worker_portfolio_featured" ON "public"."worker_portfolio" USING "btree" ("is_featured") WHERE ("is_featured" = true);



CREATE INDEX "idx_worker_portfolio_public" ON "public"."worker_portfolio" USING "btree" ("is_public") WHERE ("is_public" = true);



CREATE INDEX "idx_worker_portfolio_tags" ON "public"."worker_portfolio" USING "gin" ("tags");



CREATE INDEX "idx_worker_portfolio_worker" ON "public"."worker_portfolio" USING "btree" ("worker_id");



CREATE INDEX "idx_worker_skills_name" ON "public"."worker_skills" USING "btree" ("skill_name");



CREATE INDEX "idx_worker_skills_proficiency" ON "public"."worker_skills" USING "btree" ("proficiency" DESC);



CREATE INDEX "idx_worker_skills_verified" ON "public"."worker_skills" USING "btree" ("verified") WHERE ("verified" = true);



CREATE INDEX "idx_worker_skills_worker" ON "public"."worker_skills" USING "btree" ("worker_id");



CREATE INDEX "idx_workers_availability" ON "public"."workers" USING "btree" ("available_from") WHERE ("available_from" IS NOT NULL);



CREATE INDEX "idx_workers_location" ON "public"."workers" USING "btree" ("location_city", "radius_km");



CREATE INDEX "idx_workers_rate" ON "public"."workers" USING "btree" ("hourly_rate") WHERE ("hourly_rate" > (0)::numeric);



CREATE INDEX "idx_workers_rating" ON "public"."workers" USING "btree" ("rating" DESC, "rating_count" DESC);



CREATE INDEX "idx_workers_stripe_customer" ON "public"."workers" USING "btree" ("stripe_customer_id");



CREATE INDEX "idx_workers_subscription_status" ON "public"."workers" USING "btree" ("subscription_status");



CREATE INDEX "idx_workers_subscription_tier" ON "public"."workers" USING "btree" ("subscription_tier");



CREATE UNIQUE INDEX "workers_btw_number_key" ON "public"."workers" USING "btree" ("btw_number") WHERE ("btw_number" IS NOT NULL);



CREATE UNIQUE INDEX "workers_kvk_number_key" ON "public"."workers" USING "btree" ("kvk_number") WHERE ("kvk_number" IS NOT NULL);



CREATE OR REPLACE TRIGGER "trigger_calculate_portfolio_duration" BEFORE INSERT OR UPDATE ON "public"."worker_portfolio" FOR EACH ROW EXECUTE FUNCTION "public"."calculate_portfolio_duration"();



CREATE OR REPLACE TRIGGER "trigger_initialize_employer_stats" AFTER INSERT ON "public"."employers" FOR EACH ROW EXECUTE FUNCTION "public"."initialize_employer_stats"();



CREATE OR REPLACE TRIGGER "trigger_mark_message_as_read" BEFORE UPDATE ON "public"."messages" FOR EACH ROW EXECUTE FUNCTION "public"."mark_message_as_read"();



CREATE OR REPLACE TRIGGER "trigger_mark_notification_as_read" BEFORE UPDATE ON "public"."notifications" FOR EACH ROW EXECUTE FUNCTION "public"."mark_notification_as_read"();



CREATE OR REPLACE TRIGGER "trigger_update_applications_timestamp" BEFORE UPDATE ON "public"."applications" FOR EACH ROW EXECUTE FUNCTION "public"."update_applications_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_employer_stats_timestamp" BEFORE UPDATE ON "public"."employer_stats" FOR EACH ROW EXECUTE FUNCTION "public"."update_employer_stats_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_employers_timestamp" BEFORE UPDATE ON "public"."employers" FOR EACH ROW EXECUTE FUNCTION "public"."update_employers_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_entity_ratings" AFTER INSERT OR UPDATE ON "public"."reviews" FOR EACH ROW EXECUTE FUNCTION "public"."update_entity_ratings"();



CREATE OR REPLACE TRIGGER "trigger_update_job_applications_count" AFTER INSERT OR DELETE ON "public"."applications" FOR EACH ROW EXECUTE FUNCTION "public"."update_job_applications_count"();



CREATE OR REPLACE TRIGGER "trigger_update_reviews_timestamp" BEFORE UPDATE ON "public"."reviews" FOR EACH ROW EXECUTE FUNCTION "public"."update_reviews_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_worker_portfolio_timestamp" BEFORE UPDATE ON "public"."worker_portfolio" FOR EACH ROW EXECUTE FUNCTION "public"."update_worker_portfolio_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_worker_skills_timestamp" BEFORE UPDATE ON "public"."worker_skills" FOR EACH ROW EXECUTE FUNCTION "public"."update_worker_skills_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_workers_timestamp" BEFORE UPDATE ON "public"."workers" FOR EACH ROW EXECUTE FUNCTION "public"."update_workers_updated_at"();



CREATE OR REPLACE TRIGGER "update_jobs_updated_at" BEFORE UPDATE ON "public"."jobs" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."admin_logs"
    ADD CONSTRAINT "admin_logs_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."analytics_events"
    ADD CONSTRAINT "analytics_events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."applications"
    ADD CONSTRAINT "applications_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "public"."employers"("id");



ALTER TABLE ONLY "public"."applications"
    ADD CONSTRAINT "applications_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."applications"
    ADD CONSTRAINT "applications_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "public"."workers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."certificates"
    ADD CONSTRAINT "certificates_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."certificates"
    ADD CONSTRAINT "certificates_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "public"."workers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."earnings"
    ADD CONSTRAINT "earnings_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "public"."employers"("id");



ALTER TABLE ONLY "public"."earnings"
    ADD CONSTRAINT "earnings_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."earnings"
    ADD CONSTRAINT "earnings_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "public"."workers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."employer_saved_workers"
    ADD CONSTRAINT "employer_saved_workers_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "public"."employers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."employer_saved_workers"
    ADD CONSTRAINT "employer_saved_workers_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "public"."workers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."employer_search_history"
    ADD CONSTRAINT "employer_search_history_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "public"."employers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."employer_stats"
    ADD CONSTRAINT "employer_stats_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "public"."employers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."employers"
    ADD CONSTRAINT "employers_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."jobs"
    ADD CONSTRAINT "jobs_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_employer_id_fkey" FOREIGN KEY ("employer_id") REFERENCES "public"."employers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_reviewed_by_admin_fkey" FOREIGN KEY ("reviewed_by_admin") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_reviewee_id_fkey" FOREIGN KEY ("reviewee_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_reviewer_id_fkey" FOREIGN KEY ("reviewer_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."reviews"
    ADD CONSTRAINT "reviews_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "public"."workers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."worker_availability"
    ADD CONSTRAINT "worker_availability_booking_job_id_fkey" FOREIGN KEY ("booking_job_id") REFERENCES "public"."jobs"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."worker_availability"
    ADD CONSTRAINT "worker_availability_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "public"."workers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."worker_portfolio"
    ADD CONSTRAINT "worker_portfolio_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "public"."workers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."worker_skills"
    ADD CONSTRAINT "worker_skills_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."worker_skills"
    ADD CONSTRAINT "worker_skills_worker_id_fkey" FOREIGN KEY ("worker_id") REFERENCES "public"."workers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."workers"
    ADD CONSTRAINT "workers_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can do all on workers" ON "public"."workers" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can do everything with applications" ON "public"."applications" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can do everything with employer stats" ON "public"."employer_stats" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can do everything with messages" ON "public"."messages" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can do everything with notifications" ON "public"."notifications" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can do everything with portfolio" ON "public"."worker_portfolio" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can do everything with reviews" ON "public"."reviews" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can do everything with saved workers" ON "public"."employer_saved_workers" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can do everything with skills" ON "public"."worker_skills" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can manage all employers" ON "public"."employers" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can manage all jobs" ON "public"."jobs" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can manage all workers" ON "public"."workers" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can verify skills" ON "public"."worker_skills" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Employers can create jobs" ON "public"."jobs" FOR INSERT WITH CHECK ((("auth"."uid"() = "employer_id") AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'employer'::"text"))))));



CREATE POLICY "Employers can delete own jobs" ON "public"."jobs" FOR DELETE USING (("auth"."uid"() = "employer_id"));



CREATE POLICY "Employers can delete saved workers" ON "public"."employer_saved_workers" FOR DELETE USING (("employer_id" = ( SELECT "employers"."id"
   FROM "public"."employers"
  WHERE ("employers"."profile_id" = "auth"."uid"()))));



CREATE POLICY "Employers can save workers" ON "public"."employer_saved_workers" FOR INSERT WITH CHECK (("employer_id" = ( SELECT "employers"."id"
   FROM "public"."employers"
  WHERE ("employers"."profile_id" = "auth"."uid"()))));



CREATE POLICY "Employers can update applications to their jobs" ON "public"."applications" FOR UPDATE USING (("employer_id" = ( SELECT "employers"."id"
   FROM "public"."employers"
  WHERE ("employers"."profile_id" = "auth"."uid"()))));



CREATE POLICY "Employers can update own employer profile" ON "public"."employers" FOR UPDATE USING (("auth"."uid"() = "profile_id"));



CREATE POLICY "Employers can update own jobs" ON "public"."jobs" FOR UPDATE USING (("auth"."uid"() = "employer_id"));



CREATE POLICY "Employers can update own stats" ON "public"."employer_stats" FOR UPDATE USING (("employer_id" = ( SELECT "employers"."id"
   FROM "public"."employers"
  WHERE ("employers"."profile_id" = "auth"."uid"()))));



CREATE POLICY "Employers can update saved workers" ON "public"."employer_saved_workers" FOR UPDATE USING (("employer_id" = ( SELECT "employers"."id"
   FROM "public"."employers"
  WHERE ("employers"."profile_id" = "auth"."uid"()))));



CREATE POLICY "Employers can view applications to their jobs" ON "public"."applications" FOR SELECT USING (("employer_id" = ( SELECT "employers"."id"
   FROM "public"."employers"
  WHERE ("employers"."profile_id" = "auth"."uid"()))));



CREATE POLICY "Employers can view own employer profile" ON "public"."employers" FOR SELECT USING (("auth"."uid"() = "profile_id"));



CREATE POLICY "Employers can view own jobs" ON "public"."jobs" FOR SELECT USING (("auth"."uid"() = "employer_id"));



CREATE POLICY "Employers can view own saved workers" ON "public"."employer_saved_workers" FOR SELECT USING (("employer_id" = ( SELECT "employers"."id"
   FROM "public"."employers"
  WHERE ("employers"."profile_id" = "auth"."uid"()))));



CREATE POLICY "Employers can view own search history" ON "public"."employer_search_history" FOR SELECT USING (("employer_id" = ( SELECT "employers"."id"
   FROM "public"."employers"
  WHERE ("employers"."profile_id" = "auth"."uid"()))));



CREATE POLICY "Employers can view own stats" ON "public"."employer_stats" FOR SELECT USING (("employer_id" = ( SELECT "employers"."id"
   FROM "public"."employers"
  WHERE ("employers"."profile_id" = "auth"."uid"()))));



CREATE POLICY "Employers can view workers" ON "public"."workers" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'employer'::"text")))));



CREATE POLICY "Only admins can view logs" ON "public"."admin_logs" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Public can view active jobs" ON "public"."jobs" FOR SELECT USING (((("status")::"text" = 'active'::"text") AND ("published_at" IS NOT NULL) AND (("expires_at" IS NULL) OR ("expires_at" > "now"()))));



CREATE POLICY "Public can view approved reviews" ON "public"."reviews" FOR SELECT USING (("status" = 'approved'::"text"));



CREATE POLICY "Public can view available slots" ON "public"."worker_availability" FOR SELECT USING (("is_booked" = false));



CREATE POLICY "Public can view public portfolio" ON "public"."worker_portfolio" FOR SELECT USING (("is_public" = true));



CREATE POLICY "Public can view skills of public workers" ON "public"."worker_skills" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."workers"
  WHERE (("workers"."id" = "worker_skills"."worker_id") AND ("workers"."profile_visibility" = 'public'::"text")))));



CREATE POLICY "Public can view verified certificates" ON "public"."certificates" FOR SELECT USING (("verified" = true));



CREATE POLICY "Public can view verified workers" ON "public"."workers" FOR SELECT USING (("verified" = true));



CREATE POLICY "Public can view workers" ON "public"."workers" FOR SELECT USING (true);



CREATE POLICY "System can create analytics" ON "public"."analytics_events" FOR INSERT WITH CHECK (true);



CREATE POLICY "System can create notifications" ON "public"."notifications" FOR INSERT WITH CHECK (true);



CREATE POLICY "System can create search history" ON "public"."employer_search_history" FOR INSERT WITH CHECK (true);



CREATE POLICY "Users can create reviews" ON "public"."reviews" FOR INSERT WITH CHECK (("reviewer_id" = "auth"."uid"()));



CREATE POLICY "Users can delete own notifications" ON "public"."notifications" FOR DELETE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can delete sent messages" ON "public"."messages" FOR DELETE USING (("sender_id" = "auth"."uid"()));



CREATE POLICY "Users can send messages" ON "public"."messages" FOR INSERT WITH CHECK (("sender_id" = "auth"."uid"()));



CREATE POLICY "Users can update own notifications" ON "public"."notifications" FOR UPDATE USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can update own pending reviews" ON "public"."reviews" FOR UPDATE USING ((("reviewer_id" = "auth"."uid"()) AND ("status" = 'pending'::"text")));



CREATE POLICY "Users can update received messages" ON "public"."messages" FOR UPDATE USING (("recipient_id" = "auth"."uid"()));



CREATE POLICY "Users can view own analytics" ON "public"."analytics_events" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view own notifications" ON "public"."notifications" FOR SELECT USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Users can view their messages" ON "public"."messages" FOR SELECT USING ((("sender_id" = "auth"."uid"()) OR ("recipient_id" = "auth"."uid"())));



CREATE POLICY "Users can view their own reviews" ON "public"."reviews" FOR SELECT USING ((("reviewer_id" = "auth"."uid"()) OR ("reviewee_id" = "auth"."uid"())));



CREATE POLICY "Workers can create applications" ON "public"."applications" FOR INSERT WITH CHECK (("worker_id" = ( SELECT "workers"."id"
   FROM "public"."workers"
  WHERE ("workers"."profile_id" = "auth"."uid"()))));



CREATE POLICY "Workers can create own earnings" ON "public"."earnings" FOR INSERT WITH CHECK (("worker_id" = ( SELECT "workers"."id"
   FROM "public"."workers"
  WHERE ("workers"."profile_id" = "auth"."uid"()))));



CREATE POLICY "Workers can create own portfolio" ON "public"."worker_portfolio" FOR INSERT WITH CHECK (("worker_id" = ( SELECT "workers"."id"
   FROM "public"."workers"
  WHERE ("workers"."profile_id" = "auth"."uid"()))));



CREATE POLICY "Workers can create own skills" ON "public"."worker_skills" FOR INSERT WITH CHECK (("worker_id" = ( SELECT "workers"."id"
   FROM "public"."workers"
  WHERE ("workers"."profile_id" = "auth"."uid"()))));



CREATE POLICY "Workers can delete own pending applications" ON "public"."applications" FOR DELETE USING ((("worker_id" = ( SELECT "workers"."id"
   FROM "public"."workers"
  WHERE ("workers"."profile_id" = "auth"."uid"()))) AND ("status" = 'pending'::"text")));



CREATE POLICY "Workers can delete own portfolio" ON "public"."worker_portfolio" FOR DELETE USING (("worker_id" = ( SELECT "workers"."id"
   FROM "public"."workers"
  WHERE ("workers"."profile_id" = "auth"."uid"()))));



CREATE POLICY "Workers can delete own skills" ON "public"."worker_skills" FOR DELETE USING (("worker_id" = ( SELECT "workers"."id"
   FROM "public"."workers"
  WHERE ("workers"."profile_id" = "auth"."uid"()))));



CREATE POLICY "Workers can manage own availability" ON "public"."worker_availability" USING (("worker_id" = ( SELECT "workers"."id"
   FROM "public"."workers"
  WHERE ("workers"."profile_id" = "auth"."uid"()))));



CREATE POLICY "Workers can manage own certificates" ON "public"."certificates" USING (("worker_id" = ( SELECT "workers"."id"
   FROM "public"."workers"
  WHERE ("workers"."profile_id" = "auth"."uid"()))));



CREATE POLICY "Workers can update own data" ON "public"."workers" FOR UPDATE USING (("auth"."uid"() = "profile_id")) WITH CHECK (("auth"."uid"() = "profile_id"));



CREATE POLICY "Workers can update own pending applications" ON "public"."applications" FOR UPDATE USING ((("worker_id" = ( SELECT "workers"."id"
   FROM "public"."workers"
  WHERE ("workers"."profile_id" = "auth"."uid"()))) AND ("status" = 'pending'::"text")));



CREATE POLICY "Workers can update own portfolio" ON "public"."worker_portfolio" FOR UPDATE USING (("worker_id" = ( SELECT "workers"."id"
   FROM "public"."workers"
  WHERE ("workers"."profile_id" = "auth"."uid"()))));



CREATE POLICY "Workers can update own skills" ON "public"."worker_skills" FOR UPDATE USING (("worker_id" = ( SELECT "workers"."id"
   FROM "public"."workers"
  WHERE ("workers"."profile_id" = "auth"."uid"()))));



CREATE POLICY "Workers can update own worker profile" ON "public"."workers" FOR UPDATE USING (("auth"."uid"() = "profile_id"));



CREATE POLICY "Workers can view employers" ON "public"."employers" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'worker'::"text")))));



CREATE POLICY "Workers can view own applications" ON "public"."applications" FOR SELECT USING (("worker_id" = ( SELECT "workers"."id"
   FROM "public"."workers"
  WHERE ("workers"."profile_id" = "auth"."uid"()))));



CREATE POLICY "Workers can view own data" ON "public"."workers" FOR SELECT USING (("auth"."uid"() = "profile_id"));



CREATE POLICY "Workers can view own earnings" ON "public"."earnings" FOR SELECT USING (("worker_id" = ( SELECT "workers"."id"
   FROM "public"."workers"
  WHERE ("workers"."profile_id" = "auth"."uid"()))));



CREATE POLICY "Workers can view own portfolio" ON "public"."worker_portfolio" FOR SELECT USING (("worker_id" = ( SELECT "workers"."id"
   FROM "public"."workers"
  WHERE ("workers"."profile_id" = "auth"."uid"()))));



CREATE POLICY "Workers can view own skills" ON "public"."worker_skills" FOR SELECT USING (("worker_id" = ( SELECT "workers"."id"
   FROM "public"."workers"
  WHERE ("workers"."profile_id" = "auth"."uid"()))));



CREATE POLICY "Workers can view own worker profile" ON "public"."workers" FOR SELECT USING (("auth"."uid"() = "profile_id"));



ALTER TABLE "public"."admin_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."analytics_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."applications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."certificates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."earnings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "emp_insert_self" ON "public"."employers" FOR INSERT TO "authenticated" WITH CHECK (("profile_id" = "auth"."uid"()));



CREATE POLICY "emp_select_self" ON "public"."employers" FOR SELECT TO "authenticated" USING (("profile_id" = "auth"."uid"()));



CREATE POLICY "emp_update_self" ON "public"."employers" FOR UPDATE TO "authenticated" USING (("profile_id" = "auth"."uid"())) WITH CHECK (("profile_id" = "auth"."uid"()));



ALTER TABLE "public"."employer_saved_workers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."employer_search_history" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."employer_stats" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."employers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "employers_select_owner" ON "public"."employers" FOR SELECT USING (("profile_id" = "auth"."uid"()));



CREATE POLICY "employers_select_self" ON "public"."employers" FOR SELECT TO "authenticated" USING (("profile_id" = "auth"."uid"()));



CREATE POLICY "employers_update_owner" ON "public"."employers" FOR UPDATE USING (("profile_id" = "auth"."uid"()));



CREATE POLICY "employers_upsert_owner" ON "public"."employers" FOR INSERT WITH CHECK (("profile_id" = "auth"."uid"()));



ALTER TABLE "public"."jobs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_select_self" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("id" = "auth"."uid"()));



CREATE POLICY "profiles_update_self" ON "public"."profiles" FOR UPDATE TO "authenticated" USING (("id" = "auth"."uid"())) WITH CHECK (("id" = "auth"."uid"()));



ALTER TABLE "public"."reviews" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."worker_availability" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."worker_portfolio" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "worker_self_insert" ON "public"."workers" FOR INSERT TO "authenticated" WITH CHECK (("profile_id" = "auth"."uid"()));



CREATE POLICY "worker_self_select" ON "public"."workers" FOR SELECT TO "authenticated" USING (("profile_id" = "auth"."uid"()));



CREATE POLICY "worker_self_update" ON "public"."workers" FOR UPDATE TO "authenticated" USING (("profile_id" = "auth"."uid"())) WITH CHECK (("profile_id" = "auth"."uid"()));



ALTER TABLE "public"."worker_skills" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."workers" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."calculate_portfolio_duration"() TO "anon";
GRANT ALL ON FUNCTION "public"."calculate_portfolio_duration"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."calculate_portfolio_duration"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_notification"("p_user_id" "uuid", "p_type" "text", "p_title" "text", "p_message" "text", "p_link" "text", "p_data" "jsonb", "p_priority" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_notification"("p_user_id" "uuid", "p_type" "text", "p_title" "text", "p_message" "text", "p_link" "text", "p_data" "jsonb", "p_priority" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_notification"("p_user_id" "uuid", "p_type" "text", "p_title" "text", "p_message" "text", "p_link" "text", "p_data" "jsonb", "p_priority" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."custom_access_token_hook"("event" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."custom_access_token_hook"("event" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."custom_access_token_hook"("event" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_certificate_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_certificate_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_certificate_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_unread_message_count"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_unread_message_count"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_unread_message_count"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_unread_notifications_count"("p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_unread_notifications_count"("p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_unread_notifications_count"("p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_worker_earnings_stats"("p_worker_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_worker_earnings_stats"("p_worker_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_worker_earnings_stats"("p_worker_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."initialize_employer_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."initialize_employer_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."initialize_employer_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."log_subscription_event"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_subscription_event"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_subscription_event"() TO "service_role";



GRANT ALL ON FUNCTION "public"."mark_message_as_read"() TO "anon";
GRANT ALL ON FUNCTION "public"."mark_message_as_read"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_message_as_read"() TO "service_role";



GRANT ALL ON FUNCTION "public"."mark_notification_as_read"() TO "anon";
GRANT ALL ON FUNCTION "public"."mark_notification_as_read"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."mark_notification_as_read"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_applications_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_applications_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_applications_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_employer_stats"("p_employer_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."update_employer_stats"("p_employer_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_employer_stats"("p_employer_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_employer_stats_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_employer_stats_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_employer_stats_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_employers_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_employers_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_employers_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_entity_ratings"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_entity_ratings"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_entity_ratings"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_job_applications_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_job_applications_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_job_applications_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_reviews_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_reviews_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_reviews_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_worker_portfolio_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_worker_portfolio_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_worker_portfolio_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_worker_skills_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_worker_skills_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_worker_skills_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_workers_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_workers_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_workers_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_zzp_exam_timestamp"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_zzp_exam_timestamp"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_zzp_exam_timestamp"() TO "service_role";



GRANT ALL ON TABLE "public"."admin_logs" TO "anon";
GRANT ALL ON TABLE "public"."admin_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_logs" TO "service_role";



GRANT ALL ON TABLE "public"."analytics_events" TO "anon";
GRANT ALL ON TABLE "public"."analytics_events" TO "authenticated";
GRANT ALL ON TABLE "public"."analytics_events" TO "service_role";



GRANT ALL ON TABLE "public"."applications" TO "anon";
GRANT ALL ON TABLE "public"."applications" TO "authenticated";
GRANT ALL ON TABLE "public"."applications" TO "service_role";



GRANT ALL ON TABLE "public"."certificates" TO "anon";
GRANT ALL ON TABLE "public"."certificates" TO "authenticated";
GRANT ALL ON TABLE "public"."certificates" TO "service_role";



GRANT ALL ON TABLE "public"."earnings" TO "anon";
GRANT ALL ON TABLE "public"."earnings" TO "authenticated";
GRANT ALL ON TABLE "public"."earnings" TO "service_role";



GRANT ALL ON TABLE "public"."employer_saved_workers" TO "anon";
GRANT ALL ON TABLE "public"."employer_saved_workers" TO "authenticated";
GRANT ALL ON TABLE "public"."employer_saved_workers" TO "service_role";



GRANT ALL ON TABLE "public"."employer_search_history" TO "anon";
GRANT ALL ON TABLE "public"."employer_search_history" TO "authenticated";
GRANT ALL ON TABLE "public"."employer_search_history" TO "service_role";



GRANT ALL ON TABLE "public"."employer_stats" TO "anon";
GRANT ALL ON TABLE "public"."employer_stats" TO "authenticated";
GRANT ALL ON TABLE "public"."employer_stats" TO "service_role";



GRANT ALL ON TABLE "public"."employers" TO "anon";
GRANT ALL ON TABLE "public"."employers" TO "authenticated";
GRANT ALL ON TABLE "public"."employers" TO "service_role";



GRANT ALL ON TABLE "public"."jobs" TO "anon";
GRANT ALL ON TABLE "public"."jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."jobs" TO "service_role";



GRANT ALL ON TABLE "public"."messages" TO "anon";
GRANT ALL ON TABLE "public"."messages" TO "authenticated";
GRANT ALL ON TABLE "public"."messages" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."reviews" TO "anon";
GRANT ALL ON TABLE "public"."reviews" TO "authenticated";
GRANT ALL ON TABLE "public"."reviews" TO "service_role";



GRANT ALL ON TABLE "public"."v_employers" TO "anon";
GRANT ALL ON TABLE "public"."v_employers" TO "authenticated";
GRANT ALL ON TABLE "public"."v_employers" TO "service_role";



GRANT ALL ON TABLE "public"."v_profiles" TO "anon";
GRANT ALL ON TABLE "public"."v_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."v_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."workers" TO "anon";
GRANT ALL ON TABLE "public"."workers" TO "authenticated";
GRANT ALL ON TABLE "public"."workers" TO "service_role";



GRANT ALL ON TABLE "public"."v_workers" TO "anon";
GRANT ALL ON TABLE "public"."v_workers" TO "authenticated";
GRANT ALL ON TABLE "public"."v_workers" TO "service_role";



GRANT ALL ON TABLE "public"."worker_availability" TO "anon";
GRANT ALL ON TABLE "public"."worker_availability" TO "authenticated";
GRANT ALL ON TABLE "public"."worker_availability" TO "service_role";



GRANT ALL ON TABLE "public"."worker_portfolio" TO "anon";
GRANT ALL ON TABLE "public"."worker_portfolio" TO "authenticated";
GRANT ALL ON TABLE "public"."worker_portfolio" TO "service_role";



GRANT ALL ON TABLE "public"."worker_skills" TO "anon";
GRANT ALL ON TABLE "public"."worker_skills" TO "authenticated";
GRANT ALL ON TABLE "public"."worker_skills" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







RESET ALL;
