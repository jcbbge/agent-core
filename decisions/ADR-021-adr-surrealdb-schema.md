# ADR SurrealDB Schema

Simple, flat document structure for ADRs stored in SurrealDB.

## Table: `adr`

```sql
-- Define table
DEFINE TABLE adr SCHEMAFULL;

-- Fields (all flat, no nested objects)
DEFINE FIELD number ON adr TYPE string;        -- "001", "002", etc.
DEFINE FIELD title ON adr TYPE string;         -- Short title
DEFINE FIELD date ON adr TYPE string;          -- ISO date "2026-03-24"
DEFINE FIELD status ON adr TYPE string;        -- "draft" | "accepted" | "superseded" | "deprecated"
DEFINE FIELD context ON adr TYPE string;       -- Context section
DEFINE FIELD decision ON adr TYPE string;      -- Decision section  
DEFINE FIELD consequences ON adr TYPE string;  -- Consequences section
DEFINE FIELD alternatives ON adr TYPE string;  -- Alternatives as markdown string
DEFINE FIELD resonance ON adr TYPE string;     -- Resonance/weight paragraph
DEFINE FIELD superseded_by ON adr TYPE option<string>;  -- ADR number that superseded this
DEFINE FIELD created_at ON adr TYPE datetime;
DEFINE FIELD updated_at ON adr TYPE datetime;

-- Indexes
DEFINE INDEX idx_adr_number ON adr FIELDS number UNIQUE;
DEFINE INDEX idx_adr_status ON adr FIELDS status;
DEFINE INDEX idx_adr_date ON adr FIELDS date;
```

## Document Shape

```json
{
  "id": "adr:001",
  "number": "001",
  "title": "Stack catalog uses SurrealDB graph model",
  "date": "2026-03-09",
  "status": "accepted",
  "context": "What situation forced a decision?...",
  "decision": "The choice made...",
  "consequences": "What becomes easier/harder...",
  "alternatives": "| Alternative | Why rejected |\n|---|---|\n| Option A | Reason |",
  "resonance": "The felt sense of why this mattered...",
  "superseded_by": null,
  "created_at": "2026-03-09T04:01:00Z",
  "updated_at": "2026-03-09T04:01:00Z"
}
```

## Flat Design Principles

**No nested objects** - everything is a string. This is intentional:
- Simple to query: `SELECT * FROM adr WHERE status = 'accepted'`
- Simple to update: single field updates
- No joins needed - self-contained records
- Works like MongoDB documents

**Markdown in string fields** - Alternatives table, context paragraphs, etc. stored as markdown strings that render on display.

**Number as string** - "001", "002" not integers to preserve leading zeros and make display consistent.

## Migration Script

`~/Documents/_agents/scripts/migrate-adrs-to-surreal.js`

```javascript
// Reads ADR-XXX-*.md files, parses into flat fields, inserts into adr table
// Run once to migrate existing ADRs
```

## Usage Patterns

**Query recent ADRs:**
```sql
SELECT number, title, date, status 
FROM adr 
WHERE status = 'accepted' 
ORDER BY number DESC 
LIMIT 5;
```

**Insert new ADR:**
```sql
CREATE adr CONTENT {
  number: '021',
  title: 'New decision',
  date: '2026-03-24',
  status: 'draft',
  context: '...',
  decision: '...',
  consequences: '...',
  alternatives: '...',
  resonance: '...'
};
```

**Update status:**
```sql
UPDATE adr:021 SET status = 'accepted', updated_at = time::now();
```