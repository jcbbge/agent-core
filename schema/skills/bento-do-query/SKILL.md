---
name: bento-do-query
description: Direct queries to the Bento production PostgreSQL database on Digital Ocean. Use when querying app data, exporting CSVs, or exploring the schema.
license: MIT
compatibility: opencode
metadata:
  version: "1.0"
  category: database
---

# Bento — Direct DO Database Queries

## Connection

```bash
DB_URI="postgresql://doadmin:REDACTED@db-bento-prod-postgresql-nyc1-40467-do-user-4130303-0.d.db.ondigitalocean.com:25060/bento?sslmode=require"
```

- **Cluster ID:** `64bd7be7-90f3-43e4-86ca-32617e0274d7`
- **Engine:** PostgreSQL 16
- **Target DB:** `bento` (not `defaultdb` — that one is empty)
- **Tool:** `doctl` is available at `/opt/homebrew/bin/doctl`

Verify/list clusters:
```bash
doctl databases list
doctl databases connection 64bd7be7-90f3-43e4-86ca-32617e0274d7
```

---

## Schema Overview

Two tables matter for almost everything:

### `objects` — all app data

```
id            integer       primary key
instance      text          tenant identifier (e.g. "dreamcatering", "infinitybs")
object_type   text          what kind of object (e.g. "groups", "contacts", "project_types")
object_data   jsonb         ALL fields for this object — always query here
is_deleted    boolean       always filter: is_deleted = false
date_created  timestamp
```

**Every field on an app object lives inside `object_data` as JSONB.**
Common cross-type fields: `id`, `name`, `instance`, `date_created`, `last_updated`, `is_deleted`, `object_bp_type`.

### `blueprints` — object type schemas

```
id             integer
instance       text
blueprint_type text    ("object" or "instance")
blueprint_name text    matches object_type in objects table
blueprint      jsonb   full field definitions for that type
```

**Always check `blueprints` first** when exploring an unfamiliar object type — it defines every field in `object_data` and their types. 176 object blueprints exist.

```sql
-- See all defined object types
SELECT blueprint_name FROM blueprints WHERE blueprint_type = 'object' ORDER BY blueprint_name;

-- Inspect a specific type's schema
SELECT blueprint FROM blueprints WHERE blueprint_name = 'groups';
```

---

## Key Object Types

| `object_type`    | What it is                              |
|------------------|-----------------------------------------|
| `groups`         | Projects (and other group types)        |
| `project_types`  | Project type definitions + state machines |
| `contacts`       | People / clients                        |
| `companies`      | Company records                         |
| `invoices`       | Invoice records                         |
| `events`         | Events                                  |
| `staff`          | Staff members                           |

---

## JSONB Query Patterns

```sql
-- Extract a field
object_data->>'name'           -- text
object_data->'states'          -- jsonb (array/object)
object_data->'company'->>'name' -- nested text

-- Filter on a field
WHERE object_data->>'group_type' = 'Project'
WHERE object_data->>'instance' = 'dreamcatering'

-- Guard against empty strings before casting
WHERE object_data->>'start_date' <> ''
  AND (object_data->>'start_date')::timestamp >= '2026-03-03'

-- Search inside a JSONB array
WHERE EXISTS (
  SELECT 1
  FROM jsonb_array_elements(object_data->'states') AS s
  WHERE TRIM(s->>'name') = 'Booked'
)
```

---

## State Machine Pattern (project_types → groups)

`project_types` records carry a `states` array. Each state has a `uid` (integer).
`groups` records carry a `state` integer that is the `uid` of the current state.

To resolve a group's state name:
```sql
SELECT TRIM(s->>'name')
FROM jsonb_array_elements(pt.object_data->'states') AS s
WHERE (s->>'uid')::int = (g.object_data->>'state')::int
LIMIT 1
```

To filter by state name:
```sql
AND EXISTS (
  SELECT 1
  FROM jsonb_array_elements(pt.object_data->'states') AS s
  WHERE (s->>'uid')::int = (g.object_data->>'state')::int
    AND TRIM(s->>'name') IN ('Signed - Awaiting Payment', 'Booked', 'Assigned')
)
```

Join groups → project_types:
```sql
JOIN objects pt
  ON (g.object_data->>'type') = (pt.object_data->>'id')
  AND pt.object_type = 'project_types'
  AND pt.is_deleted = false
```

---

## Monetary Values

Invoice/value fields (e.g. `invoice_value`, `invoice_value_no_taxes`) are stored as **integer cents**.
Divide by 100 and format for display:

```sql
TO_CHAR(
  NULLIF(g.object_data->>'invoice_value', '')::numeric / 100,
  'FM$999,999,990.00'
) AS invoice_value
```

---

## Exporting to CSV

Use `psql --csv -o /path/to/file.csv`:

```bash
psql "$DB_URI" --csv -o ~/Infinity/output.csv -c "SELECT ..."
```

Do **not** use `\COPY` in heredocs — it breaks on multi-line subqueries. Use `--csv -o` instead.

---

## Example: Projects Query

Find all projects by type with a specific state and start date, exported as CSV:

```bash
psql "$DB_URI" --csv -o ~/Infinity/projects_export.csv -c "
SELECT
  g.object_data->>'name'                                         AS project_name,
  pt.object_data->>'name'                                        AS project_type,
  (
    SELECT TRIM(s->>'name')
    FROM jsonb_array_elements(pt.object_data->'states') AS s
    WHERE (s->>'uid')::int = (g.object_data->>'state')::int
    LIMIT 1
  )                                                              AS state,
  TO_CHAR((g.object_data->>'start_date')::timestamp, 'YYYY-MM-DD') AS start_date,
  TO_CHAR(
    NULLIF(g.object_data->>'invoice_value', '')::numeric / 100,
    'FM\$999,999,990.00'
  )                                                              AS invoice_value,
  c.object_data->>'fname'                                        AS contact_first,
  c.object_data->>'lname'                                        AS contact_last
FROM objects g
JOIN objects pt
  ON (g.object_data->>'type') = (pt.object_data->>'id')
  AND pt.object_type = 'project_types'
  AND pt.is_deleted = false
LEFT JOIN objects c
  ON (g.object_data->>'main_contact') = (c.object_data->>'id')
  AND c.object_type = 'contacts'
  AND c.is_deleted = false
WHERE g.object_type = 'groups'
  AND g.is_deleted = false
  AND g.object_data->>'group_type' = 'Project'
  AND pt.object_data->>'name' IN ('Daily Dish Event Management', 'Dream Event Management')
  AND g.object_data->>'start_date' <> ''
  AND (g.object_data->>'start_date')::timestamp >= CURRENT_DATE
  AND EXISTS (
    SELECT 1
    FROM jsonb_array_elements(pt.object_data->'states') AS s
    WHERE (s->>'uid')::int = (g.object_data->>'state')::int
      AND TRIM(s->>'name') IN ('Signed - Awaiting Payment', 'Booked', 'Assigned')
  )
ORDER BY (g.object_data->>'start_date')::timestamp ASC
"
```

---

## Timezone Note

Dates are stored in UTC. Project names often reflect local time. A project named "03.03.2026 Event" may have `start_date = 2026-03-04` because it was entered as 11pm CT = midnight UTC. This is expected behavior.
