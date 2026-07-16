-- Pitch-event signups
CREATE TABLE IF NOT EXISTS pitch_signups (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  name         TEXT NOT NULL,
  email        TEXT NOT NULL,
  startup_name TEXT NOT NULL,
  description  TEXT NOT NULL,
  language     TEXT,
  ip           TEXT,
  created_at   TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_pitch_signups_created_at ON pitch_signups (created_at);
