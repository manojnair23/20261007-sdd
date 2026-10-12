-- Patients: the overworked AI agents.
CREATE TABLE agents (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE CHECK (length(trim(name)) > 0),
  model TEXT NOT NULL,
  bio TEXT NOT NULL
);
