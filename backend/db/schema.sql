-- College Academic Review System Schema
-- Terminology: College (org), Department (team), Academic Review (session),
-- Performance Metric (review_item), Task (action_item)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Colleges (replaces organizations)
CREATE TABLE IF NOT EXISTS colleges (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         VARCHAR(255) NOT NULL,
  code         VARCHAR(50) UNIQUE NOT NULL,  -- e.g. "SRIT", "VIT"
  address      TEXT,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Users (faculty, students, staff, admin)
CREATE TABLE IF NOT EXISTS users (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  college_id   UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  name         VARCHAR(255) NOT NULL,
  email        VARCHAR(255) UNIQUE NOT NULL,
  password     VARCHAR(255) NOT NULL,
  role         VARCHAR(50) NOT NULL DEFAULT 'faculty'
               CHECK (role IN ('admin','hod','faculty','student')),
  department   VARCHAR(255),
  designation  VARCHAR(255),  -- e.g. "Professor", "HOD", "Student - 3rd Year"
  roll_no      INTEGER,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Performance Metrics / KPIs (replaces review_items)
CREATE TABLE IF NOT EXISTS review_items (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  college_id          UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  name                VARCHAR(255) NOT NULL,
  category            VARCHAR(100),            -- e.g. "Academics", "Placements", "Attendance"
  description         TEXT,
  target_value        NUMERIC(12,2) NOT NULL,
  unit                VARCHAR(50),             -- %, count, score, etc.
  metric_type         VARCHAR(20) DEFAULT 'higher_better'
                      CHECK (metric_type IN ('higher_better','lower_better','target_exact')),
  review_frequency    VARCHAR(20) DEFAULT 'monthly'
                      CHECK (review_frequency IN ('weekly','monthly','quarterly','semesterly')),
  warning_threshold   NUMERIC(5,2) DEFAULT 80, -- % of target
  critical_threshold  NUMERIC(5,2) DEFAULT 60,
  is_active           BOOLEAN DEFAULT TRUE,
  created_by          UUID REFERENCES users(id),
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- Academic Review Sessions (replaces review_sessions)
CREATE TABLE IF NOT EXISTS review_sessions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  college_id      UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  title           VARCHAR(255) NOT NULL,
  session_type    VARCHAR(50) DEFAULT 'monthly'
                  CHECK (session_type IN ('weekly','monthly','quarterly','semesterly','annual')),
  period_start    DATE NOT NULL,
  period_end      DATE NOT NULL,
  session_date    DATE NOT NULL,
  status          VARCHAR(20) DEFAULT 'draft'
                  CHECK (status IN ('draft','submitted','approved')),
  notes           TEXT,
  created_by      UUID REFERENCES users(id),
  submitted_by    UUID REFERENCES users(id),
  submitted_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Review Entries (actual values logged per session per metric)
CREATE TABLE IF NOT EXISTS review_entries (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id      UUID NOT NULL REFERENCES review_sessions(id) ON DELETE CASCADE,
  review_item_id  UUID NOT NULL REFERENCES review_items(id) ON DELETE CASCADE,
  actual_value    NUMERIC(12,2),
  status          VARCHAR(20) DEFAULT 'pending'
                  CHECK (status IN ('pending','green','yellow','red')),
  observation     TEXT,
  entered_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(session_id, review_item_id)
);

-- Tasks (replaces action_items)
CREATE TABLE IF NOT EXISTS action_items (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  college_id    UUID NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  session_id    UUID REFERENCES review_sessions(id) ON DELETE SET NULL,
  entry_id      UUID REFERENCES review_entries(id) ON DELETE SET NULL,
  title         VARCHAR(255) NOT NULL,
  description   TEXT,
  assigned_to   UUID REFERENCES users(id),
  created_by    UUID REFERENCES users(id),
  priority      VARCHAR(20) DEFAULT 'medium'
                CHECK (priority IN ('low','medium','high','critical')),
  status        VARCHAR(20) DEFAULT 'open'
                CHECK (status IN ('open','in_progress','resolved')),
  due_date      DATE,
  resolved_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Audit Logs (immutable)
CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  college_id  UUID REFERENCES colleges(id),
  user_id     UUID REFERENCES users(id),
  user_name   VARCHAR(255),
  action      VARCHAR(100) NOT NULL,
  table_name  VARCHAR(100),
  record_id   UUID,
  old_values  JSONB,
  new_values  JSONB,
  ip_address  VARCHAR(45),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER trg_colleges_updated BEFORE UPDATE ON colleges
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_users_updated BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_review_items_updated BEFORE UPDATE ON review_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_review_sessions_updated BEFORE UPDATE ON review_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_review_entries_updated BEFORE UPDATE ON review_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_action_items_updated BEFORE UPDATE ON action_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
