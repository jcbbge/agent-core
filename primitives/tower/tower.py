#!/usr/bin/env python3
"""tower — python client for the message bus. Mirrors tower.mjs exactly:
same schema, same send/inbox/ack/cursor semantics, same three lock fixes.
stdlib sqlite3 only — no dependency."""

import os
import sqlite3
import time
from pathlib import Path

HOME = Path(os.environ.get("TOWER_HOME") or (Path.home() / ".tower"))
DB_PATH = Path(os.environ.get("TOWER_DB") or (HOME / "tower.db"))

SCHEMA = """
CREATE TABLE IF NOT EXISTS msg (
  id        INTEGER PRIMARY KEY AUTOINCREMENT,
  ts        INTEGER NOT NULL,
  sender    TEXT    NOT NULL,
  recipient TEXT,
  topic     TEXT,
  kind      TEXT    NOT NULL,
  body      TEXT    NOT NULL,
  reply_to  INTEGER,
  dedup     TEXT UNIQUE
);
CREATE INDEX IF NOT EXISTS msg_recipient_idx ON msg(recipient, id);
CREATE INDEX IF NOT EXISTS msg_topic_idx     ON msg(topic, id);

CREATE TABLE IF NOT EXISTS cursor (
  consumer TEXT PRIMARY KEY,
  acked_id INTEGER NOT NULL DEFAULT 0,
  updated  INTEGER NOT NULL
);
"""


def _with_retry(fn, tries=8):
    """Bug fix #3 (tower.mjs withRetry): retrying is the bus's job, not the
    caller's. Retry only SQLITE_BUSY/locked; re-raise anything else."""
    wait_s = 0.02
    for i in range(tries):
        try:
            return fn()
        except sqlite3.OperationalError as e:
            busy = "locked" in str(e).lower() or "busy" in str(e).lower()
            if not busy or i >= tries - 1:
                raise
            time.sleep(wait_s)
            wait_s = min(wait_s * 2, 1.0)


def _open_db(path):
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    db = sqlite3.connect(str(path), isolation_level=None, check_same_thread=False)
    db.row_factory = sqlite3.Row
    # Bug fix #2: busy_timeout is per-connection, set unconditionally and
    # first, on every connection, before anything else touches the db.
    db.execute("PRAGMA busy_timeout=15000")
    # Bug fix #1: journal_mode persists on disk; writing it takes a brief
    # exclusive lock. Read first (no lock) and only write when it disagrees —
    # otherwise concurrent cold starts collide on that lock and SQLITE_BUSY
    # kills the process before it has sent anything (tower.mjs:87).
    mode = db.execute("PRAGMA journal_mode").fetchone()[0]
    if str(mode).lower() != "wal":
        _with_retry(lambda: db.execute("PRAGMA journal_mode=WAL"))
    return db


def open():
    db = _open_db(DB_PATH)
    # Only build the schema when it is actually missing — CREATE TABLE on
    # every open takes a write lock on every invocation.
    built = db.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='msg'"
    ).fetchone()
    if not built:
        _with_retry(lambda: db.executescript(SCHEMA))
    return db


def send(db, sender=None, body=None, recipient=None, topic=None, kind="note",
          reply_to=None, dedup=None):
    """Append one message. Returns {id, duplicate}; a dedup collision returns
    the existing id with duplicate=True instead of raising."""
    if not sender:
        raise ValueError("send: sender required")
    if not body:
        raise ValueError("send: body required")
    try:
        _with_retry(lambda: db.execute(
            """INSERT INTO msg (ts, sender, recipient, topic, kind, body, reply_to, dedup)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (int(time.time() * 1000), sender, recipient, topic, kind, body, reply_to, dedup),
        ))
    except sqlite3.IntegrityError as e:
        if dedup and "unique" in str(e).lower():
            row = db.execute("SELECT id FROM msg WHERE dedup = ?", (dedup,)).fetchone()
            if row:
                return {"id": row["id"], "duplicate": True}
        raise
    row = db.execute("SELECT last_insert_rowid() AS id").fetchone()
    return {"id": row["id"], "duplicate": False}


def inbox(db, consumer, limit=100):
    """Everything this consumer has not acknowledged: addressed to it, or
    broadcast. Never the consumer's own sends."""
    at = cursor_of(db, consumer)
    rows = db.execute(
        """SELECT * FROM msg
           WHERE id > ? AND (recipient = ? OR recipient IS NULL) AND sender <> ?
           ORDER BY id LIMIT ?""",
        (at, consumer, consumer, limit),
    ).fetchall()
    return [dict(r) for r in rows]


def cursor_of(db, consumer):
    """Absence of a cursor row means 0, never latest — a consumer that has
    never run reads the log from the beginning."""
    row = db.execute("SELECT acked_id FROM cursor WHERE consumer = ?", (consumer,)).fetchone()
    return row["acked_id"] if row else 0


def ack(db, consumer, id):
    """Advance a cursor. Monotonic: max(current, id) — an ack can never
    rewind."""
    at = cursor_of(db, consumer)
    next_id = max(at, int(id))
    now = int(time.time() * 1000)
    _with_retry(lambda: db.execute(
        """INSERT INTO cursor (consumer, acked_id, updated) VALUES (?, ?, ?)
           ON CONFLICT(consumer) DO UPDATE SET acked_id = ?, updated = ?""",
        (consumer, next_id, now, next_id, now),
    ))
    return next_id


def log(db, topic=None, recipient=None, limit=50):
    where = []
    args = []
    if topic:
        where.append("topic = ?")
        args.append(topic)
    if recipient:
        where.append("recipient = ?")
        args.append(recipient)
    clause = ("WHERE " + " AND ".join(where)) if where else ""
    args.append(limit)
    rows = db.execute(
        "SELECT * FROM msg {} ORDER BY id DESC LIMIT ?".format(clause), args
    ).fetchall()
    return [dict(r) for r in reversed(rows)]
