-- primitive_events table
-- Records every time a primitive is invoked across any harness
-- NS: dev  DB: brain

DEFINE TABLE OVERWRITE primitive_events SCHEMAFULL;

DEFINE FIELD harness        ON primitive_events TYPE string;  -- claude-code, opencode, cursor, etc.
DEFINE FIELD primitive_type ON primitive_events TYPE string;  -- skill, command, mcp, hook, rule
DEFINE FIELD primitive_name ON primitive_events TYPE string;  -- the specific skill/command/tool name
DEFINE FIELD metadata       ON primitive_events FLEXIBLE TYPE object;
DEFINE FIELD hostname       ON primitive_events TYPE string;
DEFINE FIELD recorded_at    ON primitive_events TYPE datetime DEFAULT time::now();

DEFINE INDEX idx_events_harness  ON primitive_events FIELDS harness;
DEFINE INDEX idx_events_name     ON primitive_events FIELDS primitive_name;
DEFINE INDEX idx_events_time     ON primitive_events FIELDS recorded_at;
