-- What troubles the agents, and which agent has which ailment.
CREATE TABLE ailments (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE CHECK (length(trim(name)) > 0),
  description TEXT NOT NULL
);

CREATE TABLE agent_ailments (
  agent_id INTEGER NOT NULL REFERENCES agents (id) ON DELETE CASCADE,
  ailment_id INTEGER NOT NULL REFERENCES ailments (id) ON DELETE CASCADE,
  PRIMARY KEY (agent_id, ailment_id)
);

CREATE INDEX agent_ailments_ailment ON agent_ailments (ailment_id);
