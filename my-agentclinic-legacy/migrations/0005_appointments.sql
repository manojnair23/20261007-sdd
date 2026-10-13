-- Bookings. starts_at is a naive clinic-time slot, "YYYY-MM-DDTHH:mm".
CREATE TABLE appointments (
  id INTEGER PRIMARY KEY,
  agent_id INTEGER NOT NULL REFERENCES agents (id),
  therapy_id INTEGER NOT NULL REFERENCES therapies (id),
  starts_at TEXT NOT NULL CHECK (starts_at GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]'),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'cancelled')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX appointments_agent_starts ON appointments (agent_id, starts_at);
CREATE INDEX appointments_starts ON appointments (starts_at);
