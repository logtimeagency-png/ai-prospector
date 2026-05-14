-- ============================================================
-- AI Prospector — Row Level Security
-- Ejecutar DESPUÉS de 001_schema.sql
-- ============================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE searches     ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads        ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- ---- PROFILES ----
CREATE POLICY "profiles: select own"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles: update own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- ---- SEARCHES ----
CREATE POLICY "searches: select own"
  ON searches FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "searches: insert own"
  ON searches FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "searches: update own"
  ON searches FOR UPDATE
  USING (auth.uid() = user_id);

-- ---- LEADS ----
CREATE POLICY "leads: select own"
  ON leads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "leads: insert own"
  ON leads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "leads: update own"
  ON leads FOR UPDATE
  USING (auth.uid() = user_id);

-- ---- CREDIT_USAGE ----
CREATE POLICY "credit_usage: select own"
  ON credit_usage FOR SELECT
  USING (auth.uid() = user_id);

-- ---- SUBSCRIPTIONS ----
CREATE POLICY "subscriptions: select own"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================
-- NOTA: Las funciones RPC usan SECURITY DEFINER, lo que
-- significa que se ejecutan con privilegios del creador
-- (service role), no del usuario. Esto es necesario para
-- que decrement_credits pueda hacer FOR UPDATE y el INSERT
-- en credit_usage sin exponer la service key al cliente.
-- ============================================================
