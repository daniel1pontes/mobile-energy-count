CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE residences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  residents_count SMALLINT NOT NULL CHECK (residents_count > 0),
  city VARCHAR(120),
  state VARCHAR(2),
  energy_rate NUMERIC(10, 4) NOT NULL CHECK (energy_rate >= 0),
  goal_kwh NUMERIC(10, 2) CHECK (goal_kwh > 0),
  goal_amount NUMERIC(10, 2) CHECK (goal_amount > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id)
);

CREATE TABLE energy_bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  residence_id UUID NOT NULL REFERENCES residences(id) ON DELETE CASCADE,
  reference_month SMALLINT NOT NULL CHECK (reference_month BETWEEN 1 AND 12),
  reference_year SMALLINT NOT NULL CHECK (reference_year >= 2020),
  consumption_kwh NUMERIC(10, 2) NOT NULL CHECK (consumption_kwh > 0),
  total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
  due_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (residence_id, reference_month, reference_year)
);

CREATE TABLE appliances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  residence_id UUID NOT NULL REFERENCES residences(id) ON DELETE CASCADE,
  name VARCHAR(120) NOT NULL,
  power_watts NUMERIC(10, 2) NOT NULL CHECK (power_watts > 0),
  quantity SMALLINT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  daily_usage_hours NUMERIC(5, 2) NOT NULL CHECK (daily_usage_hours >= 0 AND daily_usage_hours <= 24),
  monthly_usage_days SMALLINT NOT NULL CHECK (monthly_usage_days BETWEEN 1 AND 31),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_residences_user_id ON residences(user_id);
CREATE INDEX idx_energy_bills_residence_id ON energy_bills(residence_id);
CREATE INDEX idx_appliances_residence_id ON appliances(residence_id);
