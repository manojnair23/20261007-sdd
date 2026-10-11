-- Treatments on offer, and which ailments each one treats.
CREATE TABLE therapies (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE CHECK (length(trim(name)) > 0),
  description TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0)
);

CREATE TABLE ailment_therapies (
  ailment_id INTEGER NOT NULL REFERENCES ailments (id) ON DELETE CASCADE,
  therapy_id INTEGER NOT NULL REFERENCES therapies (id) ON DELETE CASCADE,
  PRIMARY KEY (ailment_id, therapy_id)
);

CREATE INDEX ailment_therapies_therapy ON ailment_therapies (therapy_id);
