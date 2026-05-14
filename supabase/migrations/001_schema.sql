-- ============================================================
-- AI Prospector — Schema inicial
-- Ejecutar en Supabase SQL Editor en este orden exacto
-- ============================================================

-- 1. PROFILES (extiende auth.users de Supabase)
CREATE TABLE profiles (
  id                     UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                  TEXT NOT NULL,
  plan                   TEXT NOT NULL DEFAULT 'free'
                           CHECK (plan IN ('free', 'starter', 'agency')),
  credits_total          INTEGER NOT NULL DEFAULT 5,
  credits_used           INTEGER NOT NULL DEFAULT 0,
  stripe_customer_id     TEXT,
  stripe_subscription_id TEXT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger: crear perfil automáticamente al registrarse
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Trigger: actualizar updated_at en profiles
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- 2. SEARCHES (cada búsqueda que lanza un usuario)
CREATE TABLE searches (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID    NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  query       TEXT    NOT NULL,          -- "Dentistas en Madrid"
  niche       TEXT    NOT NULL,          -- "dentistas"
  location    TEXT    NOT NULL,          -- "Madrid"
  status      TEXT    NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'processing', 'done', 'failed')),
  leads_found INTEGER NOT NULL DEFAULT 0,
  error_msg   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- 3. LEADS (un lead por negocio encontrado)
CREATE TABLE leads (
  id                   UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  search_id            UUID         NOT NULL REFERENCES searches(id) ON DELETE CASCADE,
  user_id              UUID         NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Datos de Google Maps
  place_id             TEXT         NOT NULL,   -- Google Places ID (dedup global)
  name                 TEXT         NOT NULL,
  address              TEXT,
  phone                TEXT,
  website              TEXT,
  google_maps_url      TEXT,
  rating               DECIMAL(2,1),
  reviews_count        INTEGER      NOT NULL DEFAULT 0,

  -- Análisis de la web (PageSpeed Insights + HTML)
  has_website          BOOLEAN      NOT NULL DEFAULT FALSE,
  website_speed_score  INTEGER,             -- PSI 0-100
  has_ssl              BOOLEAN,
  is_mobile_friendly   BOOLEAN,
  has_booking_system   BOOLEAN      NOT NULL DEFAULT FALSE,
  meta_title           TEXT,
  meta_description     TEXT,

  -- Opportunity Score
  opportunity_score    INTEGER      NOT NULL DEFAULT 0,  -- 0-100
  pain_points          JSONB        NOT NULL DEFAULT '[]'::jsonb,
  -- Ejemplos: ["no_website","slow_website","few_reviews","no_booking"]

  -- Scripts generados por IA
  ai_email             TEXT,
  ai_whatsapp          TEXT,
  ai_dm                TEXT,
  ai_generated_at      TIMESTAMPTZ,

  -- Estado del análisis
  analysis_status      TEXT         NOT NULL DEFAULT 'pending'
                         CHECK (analysis_status IN ('pending', 'analyzing', 'done', 'failed')),
  is_cached            BOOLEAN      NOT NULL DEFAULT FALSE,

  created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Índice para búsqueda de caché global por place_id
CREATE INDEX leads_place_id_idx ON leads (place_id, analysis_status, created_at DESC);
-- Índice para queries del dashboard de usuario
CREATE INDEX leads_user_id_idx ON leads (user_id, created_at DESC);
CREATE INDEX leads_search_id_idx ON leads (search_id);


-- 4. CREDIT_USAGE (auditoría de consumo)
CREATE TABLE credit_usage (
  id               UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID  NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lead_id          UUID  REFERENCES leads(id) ON DELETE SET NULL,
  credits_consumed INTEGER NOT NULL DEFAULT 1,
  action           TEXT  NOT NULL
                     CHECK (action IN ('lead_analysis', 'message_regenerate')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- 5. SUBSCRIPTIONS (sincronizado desde Stripe webhooks)
CREATE TABLE subscriptions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_subscription_id  TEXT UNIQUE NOT NULL,
  plan                    TEXT NOT NULL CHECK (plan IN ('starter', 'agency')),
  status                  TEXT NOT NULL
                            CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing')),
  current_period_start    TIMESTAMPTZ NOT NULL,
  current_period_end      TIMESTAMPTZ NOT NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- 6. RPC: Decremento atómico de créditos (SIEMPRE usar esta función, nunca UPDATE directo)
CREATE OR REPLACE FUNCTION decrement_credits(
  p_user_id UUID,
  p_lead_id UUID,
  p_action  TEXT DEFAULT 'lead_analysis'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_available INTEGER;
BEGIN
  -- Lock fila y verificar créditos
  SELECT (credits_total - credits_used)
    INTO v_available
    FROM profiles
   WHERE id = p_user_id
     FOR UPDATE;

  IF v_available <= 0 THEN
    RETURN FALSE;
  END IF;

  -- Decrementar
  UPDATE profiles
     SET credits_used = credits_used + 1,
         updated_at   = NOW()
   WHERE id = p_user_id;

  -- Registrar en auditoría
  INSERT INTO credit_usage (user_id, lead_id, credits_consumed, action)
  VALUES (p_user_id, p_lead_id, 1, p_action);

  RETURN TRUE;
END;
$$;


-- 7. RPC: Reset mensual de créditos (llamar desde cron o Stripe webhook invoice.payment_succeeded)
CREATE OR REPLACE FUNCTION reset_credits_for_plan(
  p_user_id     UUID,
  p_plan        TEXT,
  p_new_credits INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
     SET plan          = p_plan,
         credits_total = p_new_credits,
         credits_used  = 0,
         updated_at    = NOW()
   WHERE id = p_user_id;
END;
$$;
