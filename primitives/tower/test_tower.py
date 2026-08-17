#!/usr/bin/env python3
"""
test_tower — the regression suite for `tower.py`, the python client of the bus.

WHY THIS FILE EXISTS. Three bugs killed the old bus, were diagnosed, and were
fixed in `tower.mjs`. An untested fix is a fix that comes back, and the python
client is a second implementation of the same storage contract — which means it
is a second chance to reintroduce all three. Each of the three has a class
below, named after it, asserting the *behaviour* the fix produces rather than
the shape of the code that produces it:

  1. `journal_mode` read before written  -> TestBugOneJournalModeColdStart
  2. `busy_timeout` per connection,      -> TestBugTwoBusyTimeoutPerConnection
     unconditional, first, not folded
     into the schema blob
  3. retrying is the bus's job           -> TestBugThreeRetryIsTheBusesJob

Everything else here is the storage contract those fixes have to keep true:
send/inbox/cursor/ack/log semantics, mirrored from `tower.mjs`, and the schema,
which must be byte-identical across the two runtimes or the two clients are not
on one bus.

WRITTEN BEFORE THE IMPLEMENTATION. This file is the test seat's half of the
Plan->Implementation bifurcation (`spine-spawn make`): the criteria exist before
the code, and the seat that wrote them did not write `tower.py`. Until the
implementation seat lands `tower.py` next to this file, the suite is RED at
import — that is the correct state, not a defect.

RUNNING IT.  python3 -m unittest discover -s primitives/tower -v
         or  python3 primitives/tower/test_tower.py -v
stdlib `unittest` only. No pytest, no third-party runner, no pip install —
the whole point of the python client is that it adds no dependency.

BLAST RADIUS. Every test builds a bus in a fresh `mktemp -d` and asserts, before
it writes a byte, that the path is not `~/.tower`. `setUpModule` refuses to run
at all if the ambient TOWER_HOME/TOWER_DB point at the live bus. Five agent
panes are reading and writing that DB right now.

REPRESENTATION TOLERANCE, and its limit. The brief fixes the *semantics* of the
API, not python's representation of a row or of a send result. So `_field` and
`_result` below accept a mapping, a `sqlite3.Row`, or an attribute-bearing
object. Nothing else is softened: field names, ids, ordering, defaults, error
behaviour and the schema text are asserted exactly.
"""

import ast
import importlib
import os
import shutil
import sqlite3
import subprocess
import sys
import tempfile
import time
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
if HERE not in sys.path:
    sys.path.insert(0, HERE)

TOWER_PY = os.path.join(HERE, "tower.py")
TOWER_MJS = os.path.join(HERE, "tower.mjs")
TOWER_CLI = shutil.which("tower")
LIVE_HOME = os.path.join(os.path.expanduser("~"), ".tower")

import tower  # noqa: E402  (path is set immediately above)


# --------------------------------------------------------------------------
# helpers
# --------------------------------------------------------------------------

def setUpModule():
    """Refuse to run against the live bus, before any test opens anything."""
    for var in ("TOWER_HOME", "TOWER_DB"):
        val = os.environ.get(var)
        if not val:
            continue
        if os.path.realpath(val).startswith(os.path.realpath(LIVE_HOME)):
            raise RuntimeError(
                "%s points at the live bus (%s). Five panes are on it. "
                "Unset it and re-run." % (var, val)
            )


def _field(row, name):
    """Read a column off a row, whatever the client returns rows as."""
    if isinstance(row, dict):
        return row[name]
    try:
        return row[name]                      # sqlite3.Row, or any mapping
    except (TypeError, IndexError, KeyError):
        pass
    return getattr(row, name)


def _result(res, name):
    """Read `id` / `duplicate` off a send result, dict or object."""
    if isinstance(res, dict):
        return res[name]
    return getattr(res, name)


def _child_env(home, **extra):
    env = os.environ.copy()
    env["TOWER_HOME"] = home
    env.pop("TOWER_DB", None)
    env["PYTHONPATH"] = HERE + os.pathsep + env.get("PYTHONPATH", "")
    for k, v in extra.items():
        env[k] = str(v)
    return env


class BusCase(unittest.TestCase):
    """A fresh, temporary, provably-not-live bus per test."""

    def setUp(self):
        self.tower, self.home, self.db_path = self.fresh_home()
        self.db = self.tower.open()

    # -- environment ------------------------------------------------------

    def _set_env(self, key, value):
        old = os.environ.get(key)

        def restore():
            if old is None:
                os.environ.pop(key, None)
            else:
                os.environ[key] = old

        self.addCleanup(restore)
        if value is None:
            os.environ.pop(key, None)
        else:
            os.environ[key] = value

    def fresh_home(self):
        """A temp TOWER_HOME + a module that has seen it.

        `tower.mjs` resolves TOWER_HOME at module load. Reloading covers both
        that and a client that resolves at call time, so this helper does not
        constrain which the implementation picks.
        """
        home = tempfile.mkdtemp(prefix="tower-pytest-")
        self.addCleanup(shutil.rmtree, home, True)
        self.assertFalse(
            os.path.realpath(home).startswith(os.path.realpath(LIVE_HOME)),
            "refusing to test against the live bus",
        )
        self._set_env("TOWER_HOME", home)
        self._set_env("TOWER_DB", None)
        mod = importlib.reload(tower)
        return mod, home, os.path.join(home, "tower.db")

    # -- raw access, deliberately not through the client under test -------

    def raw(self):
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        self.addCleanup(conn.close)
        return conn

    def count(self):
        return self.raw().execute("SELECT COUNT(*) FROM msg").fetchone()[0]

    def send(self, **m):
        return self.tower.send(self.db, **m)


# --------------------------------------------------------------------------
# bug 1 — journal_mode must be READ before it is WRITTEN
# --------------------------------------------------------------------------

class TestBugOneJournalModeColdStart(BusCase):
    """Measured in tower.mjs:82-87 — 157/160 with the unconditional pragma,
    240/240 without it. Writing `PRAGMA journal_mode=WAL` takes a brief
    exclusive lock; issued on every open, concurrent cold starts collide on
    it and SQLITE_BUSY kills the process before it has sent anything."""

    CHILD = (
        "import os, tower;"
        "db = tower.open();"
        "tower.send(db, sender='w' + os.environ['W'], body='cold ' + os.environ['W'])"
    )

    def test_concurrent_cold_opens_all_exit_zero(self):
        n = 16
        home = tempfile.mkdtemp(prefix="tower-cold-")
        self.addCleanup(shutil.rmtree, home, True)
        procs = [
            subprocess.Popen(
                [sys.executable, "-c", self.CHILD],
                env=_child_env(home, W=i),
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
            )
            for i in range(n)
        ]
        results = []
        for p in procs:
            out, err = p.communicate(timeout=120)
            results.append((p.returncode, err.decode("utf-8", "replace")))

        failures = [(rc, err) for rc, err in results if rc != 0]
        self.assertEqual(
            [], failures,
            "%d/%d cold opens failed; this is bug 1 back:\n%s"
            % (len(failures), n, "\n".join(e for _, e in failures)),
        )

        conn = sqlite3.connect(os.path.join(home, "tower.db"))
        self.addCleanup(conn.close)
        self.assertEqual(
            n, conn.execute("SELECT COUNT(*) FROM msg").fetchone()[0],
            "every cold start exited 0 but not every send landed",
        )

    def test_journal_mode_is_wal_after_open(self):
        mode = self.raw().execute("PRAGMA journal_mode").fetchone()[0]
        self.assertEqual("wal", str(mode).lower())

    def test_reopening_an_established_bus_does_not_disturb_it(self):
        self.send(sender="a", body="one")
        again = self.tower.open()
        self.assertEqual(
            "wal",
            str(self.raw().execute("PRAGMA journal_mode").fetchone()[0]).lower(),
        )
        self.assertEqual(1, len(self.tower.inbox(again, "b")))


# --------------------------------------------------------------------------
# bug 2 — busy_timeout is PER CONNECTION: unconditional, first, never folded
# --------------------------------------------------------------------------

class TestBugTwoBusyTimeoutPerConnection(BusCase):
    """A busy_timeout that did not apply looks exactly like one that did,
    until the bus is under real contention. So this asserts it behaviourally
    (a send survives a held write lock) and structurally (it is not hidden
    inside the schema blob, where some multi-statement exec paths skip it)."""

    CHILD_SEND = (
        "import tower;"
        "db = tower.open();"
        "tower.send(db, sender='contender', body='survived the lock')"
    )

    def test_send_survives_a_held_write_lock(self):
        self.send(sender="seed", body="seed")          # schema exists, DB warm

        blocker = sqlite3.connect(self.db_path)
        self.addCleanup(blocker.close)
        blocker.execute("PRAGMA busy_timeout=100")
        blocker.execute("BEGIN IMMEDIATE")             # holds the write lock

        started = time.time()
        child = subprocess.Popen(
            [sys.executable, "-c", self.CHILD_SEND],
            env=_child_env(self.home),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        time.sleep(2.0)
        blocker.rollback()
        out, err = child.communicate(timeout=60)
        elapsed = time.time() - started

        self.assertEqual(
            0, child.returncode,
            "send died while a writer held the lock — busy_timeout did not "
            "apply, or the caller was left to retry:\n%s"
            % err.decode("utf-8", "replace"),
        )
        self.assertGreaterEqual(
            elapsed, 1.2,
            "the send returned before the lock was released, so it never "
            "actually contended and this test proved nothing",
        )
        rows = self.raw().execute(
            "SELECT body FROM msg WHERE sender = 'contender'").fetchall()
        self.assertEqual(1, len(rows))
        self.assertEqual("survived the lock", rows[0]["body"])

    def test_busy_timeout_is_not_folded_into_the_schema_blob(self):
        for text in _string_constants(TOWER_PY):
            if "CREATE TABLE" not in text.upper():
                continue
            lowered = text.lower()
            self.assertNotIn(
                "busy_timeout", lowered,
                "busy_timeout is inside the DDL blob; multi-statement exec "
                "paths skip it silently (bug 2)",
            )
            self.assertNotIn(
                "journal_mode", lowered,
                "journal_mode is inside the DDL blob, so it is written "
                "unconditionally on every cold build (bug 1)",
            )

    def test_busy_timeout_is_set_and_is_15000(self):
        source = _source(TOWER_PY)
        self.assertIn("busy_timeout", source, "no busy_timeout anywhere")
        self.assertTrue(
            any("busy_timeout" in s and "15000" in s
                for s in _string_constants(TOWER_PY)),
            "busy_timeout is not set to 15000 (tower.mjs:82)",
        )


# --------------------------------------------------------------------------
# bug 3 — retrying is the bus's job, not the caller's
# --------------------------------------------------------------------------

class TestBugThreeRetryIsTheBusesJob(BusCase):
    """An exception thrown at a caller is a lost message unless someone
    retries. Retry on SQLITE_BUSY / 'database is locked'; re-raise everything
    else, immediately — a validation error must not cost eight backoffs."""

    def test_a_non_busy_error_is_not_retried(self):
        started = time.time()
        with self.assertRaises(Exception):
            self.send(body="no sender")
        self.assertLess(
            time.time() - started, 1.0,
            "a validation failure went through the busy-retry ladder",
        )

        started = time.time()
        with self.assertRaises(Exception):
            self.send(sender="a")
        self.assertLess(time.time() - started, 1.0)

    def test_a_contended_write_is_retried_to_success(self):
        """Two writers, one lock, both messages land — nobody drops."""
        self.send(sender="seed", body="seed")
        blocker = sqlite3.connect(self.db_path)
        self.addCleanup(blocker.close)
        blocker.execute("PRAGMA busy_timeout=100")
        blocker.execute("BEGIN IMMEDIATE")

        children = [
            subprocess.Popen(
                [sys.executable, "-c",
                 "import os, tower;"
                 "db = tower.open();"
                 "tower.send(db, sender='w' + os.environ['W'], body='b')"],
                env=_child_env(self.home, W=i),
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
            )
            for i in range(4)
        ]
        time.sleep(1.5)
        blocker.rollback()
        errs = []
        for c in children:
            _, err = c.communicate(timeout=60)
            if c.returncode != 0:
                errs.append(err.decode("utf-8", "replace"))
        self.assertEqual([], errs, "contended writers raised at the caller")
        self.assertEqual(5, self.count(), "a contended write was lost")

    def test_ack_is_retried_too(self):
        """tower.mjs wraps three call sites: schema build, send INSERT, ack
        upsert. The ack is the one that is easy to leave bare."""
        self.send(sender="a", body="one")
        blocker = sqlite3.connect(self.db_path)
        self.addCleanup(blocker.close)
        blocker.execute("PRAGMA busy_timeout=100")
        blocker.execute("BEGIN IMMEDIATE")
        child = subprocess.Popen(
            [sys.executable, "-c",
             "import tower;"
             "db = tower.open();"
             "tower.ack(db, 'b', 1)"],
            env=_child_env(self.home),
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        time.sleep(1.5)
        blocker.rollback()
        _, err = child.communicate(timeout=60)
        self.assertEqual(
            0, child.returncode,
            "the ack upsert is not wrapped in the retry:\n%s"
            % err.decode("utf-8", "replace"),
        )
        self.assertEqual(
            1,
            self.raw().execute(
                "SELECT acked_id FROM cursor WHERE consumer='b'").fetchone()[0],
        )


# --------------------------------------------------------------------------
# send — idempotency is the contract, dedup is the mechanism
# --------------------------------------------------------------------------

class TestSend(BusCase):

    def test_dedup_collision_returns_the_existing_id_and_does_not_raise(self):
        first = self.send(sender="a", body="original", dedup="k1")
        second = self.send(sender="a", body="a retry with different text",
                           dedup="k1")
        self.assertEqual(_result(first, "id"), _result(second, "id"))
        self.assertFalse(_result(first, "duplicate"))
        self.assertTrue(_result(second, "duplicate"))
        self.assertEqual(1, self.count(), "the duplicate was stored anyway")
        self.assertEqual(
            "original",
            self.raw().execute("SELECT body FROM msg WHERE id=?",
                               (_result(first, "id"),)).fetchone()[0],
            "the retry overwrote the original; the log is append-only",
        )

    def test_dedup_is_only_a_constraint_when_supplied(self):
        a = self.send(sender="a", body="one")
        b = self.send(sender="a", body="one")
        self.assertNotEqual(_result(a, "id"), _result(b, "id"))
        self.assertEqual(2, self.count())

    def test_kind_defaults_to_note(self):
        rid = _result(self.send(sender="a", body="x"), "id")
        self.assertEqual(
            "note",
            self.raw().execute("SELECT kind FROM msg WHERE id=?",
                               (rid,)).fetchone()[0])

    def test_sender_and_body_are_required(self):
        with self.assertRaises(Exception):
            self.send(body="no sender")
        with self.assertRaises(Exception):
            self.send(sender="a")
        with self.assertRaises(Exception):
            self.send(sender="a", body="")
        self.assertEqual(0, self.count())

    def test_ts_is_milliseconds_not_seconds(self):
        before = int(time.time() * 1000)
        rid = _result(self.send(sender="a", body="x"), "id")
        after = int(time.time() * 1000)
        ts = self.raw().execute(
            "SELECT ts FROM msg WHERE id=?", (rid,)).fetchone()[0]
        self.assertIsInstance(ts, int)
        self.assertGreaterEqual(ts, before)
        self.assertLessEqual(ts, after)

    def test_optional_columns_default_to_null(self):
        rid = _result(self.send(sender="a", body="x"), "id")
        row = self.raw().execute(
            "SELECT recipient, topic, reply_to, dedup FROM msg WHERE id=?",
            (rid,)).fetchone()
        self.assertEqual((None, None, None, None), tuple(row))

    def test_reply_to_correlates_an_answer_to_its_question(self):
        q = _result(
            self.send(sender="a", recipient="b", body="?", kind="question"),
            "id")
        self.send(sender="b", recipient="a", body="!", kind="answer",
                  reply_to=q)
        self.assertEqual(
            q,
            self.raw().execute(
                "SELECT reply_to FROM msg WHERE kind='answer'").fetchone()[0])

    def test_ids_are_monotonic(self):
        ids = [_result(self.send(sender="a", body=str(i)), "id")
               for i in range(5)]
        self.assertEqual(sorted(ids), ids)
        self.assertEqual(len(set(ids)), len(ids))


# --------------------------------------------------------------------------
# inbox + cursor — "unread" is computed, never a flag anyone sets
# --------------------------------------------------------------------------

class TestInboxAndCursor(BusCase):

    def test_a_brand_new_consumer_reads_from_the_beginning(self):
        """A new cursor starts at 0, NEVER at the latest id. This is the bug
        that dropped 99 of 308 completions on the old bus."""
        self.send(sender="alice", recipient="bob", body="the first message")
        rows = self.tower.inbox(self.db, "bob")
        self.assertEqual(1, len(rows), "a never-seen consumer saw nothing")
        self.assertEqual(1, _field(rows[0], "id"))
        self.assertEqual("the first message", _field(rows[0], "body"))

    def test_cursor_of_an_absent_consumer_is_zero(self):
        self.assertEqual(0, self.tower.cursor_of(self.db, "never-ran"))

    def test_inbox_excludes_the_consumers_own_sends(self):
        self.send(sender="bob", recipient="bob", body="to myself")
        self.send(sender="bob", body="my own broadcast")
        self.send(sender="alice", recipient="bob", body="for bob")
        rows = self.tower.inbox(self.db, "bob")
        self.assertEqual(["for bob"], [_field(r, "body") for r in rows])

    def test_inbox_includes_broadcasts(self):
        self.send(sender="alice", body="broadcast")            # recipient NULL
        self.send(sender="alice", recipient="bob", body="direct")
        self.send(sender="alice", recipient="carol", body="not for bob")
        self.assertEqual(
            ["broadcast", "direct"],
            [_field(r, "body") for r in self.tower.inbox(self.db, "bob")])

    def test_inbox_is_ordered_by_id_and_honours_limit(self):
        for i in range(10):
            self.send(sender="alice", recipient="bob", body="m%d" % i)
        rows = self.tower.inbox(self.db, "bob", 3)
        self.assertEqual(["m0", "m1", "m2"], [_field(r, "body") for r in rows])

    def test_inbox_default_limit_is_100(self):
        for i in range(105):
            self.send(sender="alice", recipient="bob", body="m%d" % i)
        self.assertEqual(100, len(self.tower.inbox(self.db, "bob")))

    def test_inbox_resumes_at_the_cursor(self):
        for i in range(5):
            self.send(sender="alice", recipient="bob", body="m%d" % i)
        self.tower.ack(self.db, "bob", 3)
        self.assertEqual(
            ["m3", "m4"],
            [_field(r, "body") for r in self.tower.inbox(self.db, "bob")])

    def test_nothing_is_ever_marked_delivered(self):
        """Reading is not a write. Two reads without an ack see the same
        thing — that is what makes delivery at-least-once by construction."""
        self.send(sender="alice", recipient="bob", body="x")
        self.assertEqual(1, len(self.tower.inbox(self.db, "bob")))
        self.assertEqual(1, len(self.tower.inbox(self.db, "bob")))
        self.assertEqual(0, self.tower.cursor_of(self.db, "bob"))


# --------------------------------------------------------------------------
# ack — monotonic, upsert, never rewinds
# --------------------------------------------------------------------------

class TestAck(BusCase):

    def test_ack_is_monotonic_and_cannot_rewind(self):
        for i in range(5):
            self.send(sender="alice", recipient="bob", body="m%d" % i)
        self.assertEqual(4, self.tower.ack(self.db, "bob", 4))
        self.assertEqual(
            4, self.tower.ack(self.db, "bob", 2),
            "acking a lower id rewound the cursor",
        )
        self.assertEqual(4, self.tower.cursor_of(self.db, "bob"))
        self.assertEqual(
            ["m4"],
            [_field(r, "body") for r in self.tower.inbox(self.db, "bob")])

    def test_ack_upserts_rather_than_duplicating(self):
        self.send(sender="alice", recipient="bob", body="x")
        self.tower.ack(self.db, "bob", 1)
        self.tower.ack(self.db, "bob", 1)
        self.assertEqual(
            1,
            self.raw().execute(
                "SELECT COUNT(*) FROM cursor WHERE consumer='bob'").fetchone()[0])

    def test_ack_creates_the_row_for_a_first_time_consumer(self):
        self.send(sender="alice", recipient="bob", body="x")
        self.assertEqual(1, self.tower.ack(self.db, "bob", 1))
        row = self.raw().execute(
            "SELECT acked_id, updated FROM cursor WHERE consumer='bob'"
        ).fetchone()
        self.assertEqual(1, row["acked_id"])
        self.assertGreater(row["updated"], 10 ** 12, "updated is not in ms")

    def test_cursors_are_independent_per_consumer(self):
        for i in range(3):
            self.send(sender="alice", body="m%d" % i)
        self.tower.ack(self.db, "bob", 3)
        self.assertEqual(3, self.tower.cursor_of(self.db, "bob"))
        self.assertEqual(0, self.tower.cursor_of(self.db, "carol"))
        self.assertEqual(3, len(self.tower.inbox(self.db, "carol")))


# --------------------------------------------------------------------------
# log — DESC + LIMIT, then reversed
# --------------------------------------------------------------------------

class TestLog(BusCase):

    def seed(self):
        self.send(sender="a", recipient="b", topic="t1", body="1")
        self.send(sender="a", recipient="c", topic="t2", body="2")
        self.send(sender="a", recipient="b", topic="t1", body="3")
        self.send(sender="a", topic="t2", body="4")

    def test_log_returns_the_tail_in_ascending_order(self):
        self.seed()
        self.assertEqual(
            ["1", "2", "3", "4"],
            [_field(r, "body") for r in self.tower.log(self.db)])

    def test_log_limit_takes_the_newest_then_reverses(self):
        self.seed()
        self.assertEqual(
            ["3", "4"],
            [_field(r, "body") for r in self.tower.log(self.db, limit=2)])

    def test_log_filters_by_topic(self):
        self.seed()
        self.assertEqual(
            ["2", "4"],
            [_field(r, "body")
             for r in self.tower.log(self.db, topic="t2")])

    def test_log_filters_by_recipient(self):
        self.seed()
        self.assertEqual(
            ["1", "3"],
            [_field(r, "body")
             for r in self.tower.log(self.db, recipient="b")])

    def test_log_filters_combine_with_and(self):
        self.seed()
        self.assertEqual(
            ["1", "3"],
            [_field(r, "body")
             for r in self.tower.log(self.db, topic="t1", recipient="b")])

    def test_log_default_limit_is_50(self):
        for i in range(60):
            self.send(sender="a", body="m%d" % i)
        rows = self.tower.log(self.db)
        self.assertEqual(50, len(rows))
        self.assertEqual("m10", _field(rows[0], "body"))
        self.assertEqual("m59", _field(rows[-1], "body"))


# --------------------------------------------------------------------------
# paths — the two env vars, same precedence as tower.mjs:45-47
# --------------------------------------------------------------------------

class TestPaths(BusCase):

    def test_tower_home_is_honoured(self):
        self.send(sender="a", body="x")
        self.assertTrue(os.path.exists(self.db_path),
                        "TOWER_HOME was ignored; the DB is not at %s"
                        % self.db_path)

    def test_tower_db_overrides_tower_home(self):
        other = tempfile.mkdtemp(prefix="tower-dbvar-")
        self.addCleanup(shutil.rmtree, other, True)
        explicit = os.path.join(other, "elsewhere.db")
        self._set_env("TOWER_DB", explicit)
        mod = importlib.reload(tower)
        db = mod.open()
        mod.send(db, sender="a", body="x")
        self.assertTrue(os.path.exists(explicit), "TOWER_DB was ignored")

    def test_open_creates_a_missing_home_directory(self):
        nested = os.path.join(self.home, "does", "not", "exist")
        self._set_env("TOWER_HOME", nested)
        mod = importlib.reload(tower)
        db = mod.open()
        mod.send(db, sender="a", body="x")
        self.assertTrue(os.path.exists(os.path.join(nested, "tower.db")))

    def test_the_client_works_from_an_arbitrary_cwd(self):
        """Handlers import tower from scripts whose cwd is anything."""
        elsewhere = tempfile.mkdtemp(prefix="tower-cwd-")
        self.addCleanup(shutil.rmtree, elsewhere, True)
        proc = subprocess.run(
            [sys.executable, "-c",
             "import tower; db = tower.open();"
             "print(tower.send(db, sender='a', body='x'))"],
            cwd=elsewhere, env=_child_env(self.home),
            stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=60,
        )
        self.assertEqual(0, proc.returncode,
                         proc.stderr.decode("utf-8", "replace"))


# --------------------------------------------------------------------------
# the schema is the contract between the two runtimes
# --------------------------------------------------------------------------

class TestSchema(BusCase):

    def objects(self, db_path):
        conn = sqlite3.connect(db_path)
        try:
            return conn.execute(
                "SELECT type, name, sql FROM sqlite_master "
                "WHERE name NOT LIKE 'sqlite_%' ORDER BY name"
            ).fetchall()
        finally:
            conn.close()

    def test_tables_and_indices_exist(self):
        names = {r[1] for r in self.objects(self.db_path)}
        self.assertLessEqual(
            {"msg", "cursor", "msg_recipient_idx", "msg_topic_idx"}, names)

    def test_msg_is_append_only_shaped(self):
        cols = {r[1]: r for r in
                self.raw().execute("PRAGMA table_info(msg)").fetchall()}
        self.assertEqual(
            ["id", "ts", "sender", "recipient", "topic", "kind", "body",
             "reply_to", "dedup"],
            [r[1] for r in
             self.raw().execute("PRAGMA table_info(msg)").fetchall()],
        )
        for required in ("ts", "sender", "kind", "body"):
            self.assertEqual(1, cols[required][3],
                             "%s must be NOT NULL" % required)
        for optional in ("recipient", "topic", "reply_to", "dedup"):
            self.assertEqual(0, cols[optional][3],
                             "%s must be nullable" % optional)

    def test_dedup_is_unique(self):
        self.send(sender="a", body="x", dedup="k")
        with self.assertRaises(sqlite3.IntegrityError):
            conn = self.raw()
            conn.execute(
                "INSERT INTO msg (ts, sender, kind, body, dedup) "
                "VALUES (1, 'a', 'note', 'y', 'k')")
            conn.commit()

    def test_cursor_shape(self):
        cols = self.raw().execute("PRAGMA table_info(cursor)").fetchall()
        self.assertEqual(["consumer", "acked_id", "updated"],
                         [c[1] for c in cols])
        self.assertEqual(1, cols[0][5], "consumer must be the primary key")

    @unittest.skipIf(TOWER_CLI is None, "the node `tower` CLI is not on PATH")
    def test_schema_is_byte_identical_to_the_one_the_node_cli_builds(self):
        node_home = tempfile.mkdtemp(prefix="tower-node-")
        self.addCleanup(shutil.rmtree, node_home, True)
        env = os.environ.copy()
        env["TOWER_HOME"] = node_home
        env.pop("TOWER_DB", None)
        proc = subprocess.run(
            [TOWER_CLI, "send", "--from", "node-side", "built by node"],
            env=env, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=60)
        self.assertEqual(0, proc.returncode,
                         proc.stderr.decode("utf-8", "replace"))

        node_objs = self.objects(os.path.join(node_home, "tower.db"))
        py_objs = self.objects(self.db_path)
        self.assertEqual(
            [(t, n, s) for t, n, s in node_objs],
            [(t, n, s) for t, n, s in py_objs],
            "python and node do not build the same schema — the DDL must be "
            "copied verbatim from tower.mjs, comments and all",
        )

    @unittest.skipIf(TOWER_CLI is None, "the node `tower` CLI is not on PATH")
    def test_the_two_runtimes_read_each_others_rows(self):
        self.send(sender="py-side", recipient="node-side", body="from python")
        env = os.environ.copy()
        env["TOWER_HOME"] = self.home
        env.pop("TOWER_DB", None)

        seen = subprocess.run(
            [TOWER_CLI, "inbox", "node-side", "--json"],
            env=env, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=60)
        self.assertEqual(0, seen.returncode,
                         seen.stderr.decode("utf-8", "replace"))
        self.assertIn("from python", seen.stdout.decode("utf-8", "replace"),
                      "node cannot see what python wrote")

        wrote = subprocess.run(
            [TOWER_CLI, "send", "--from", "node-side", "--to", "py-side",
             "from node"],
            env=env, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=60)
        self.assertEqual(0, wrote.returncode,
                         wrote.stderr.decode("utf-8", "replace"))
        self.assertIn(
            "from node",
            [_field(r, "body") for r in self.tower.inbox(self.db, "py-side")],
            "python cannot see what node wrote",
        )


# --------------------------------------------------------------------------
# "i dont want another fucking dependency"
# --------------------------------------------------------------------------

def _source(path):
    with open(path, "r") as fh:
        return fh.read()


def _string_constants(path):
    out = []
    for node in ast.walk(ast.parse(_source(path))):
        if isinstance(node, ast.Constant) and isinstance(node.value, str):
            out.append(node.value)
    return out


STDLIB_ALLOWED = {
    "argparse", "collections", "contextlib", "dataclasses", "errno",
    "functools", "getpass", "itertools", "json", "logging", "os", "pathlib",
    "random", "re", "shutil", "socket", "sqlite3", "subprocess", "sys",
    "tempfile", "textwrap", "threading", "time", "typing", "uuid", "warnings",
    "__future__",
}


class TestNoDependencies(unittest.TestCase):

    def test_tower_py_exists_next_to_tower_mjs(self):
        self.assertTrue(os.path.exists(TOWER_PY), TOWER_PY)
        self.assertTrue(os.path.exists(TOWER_MJS), TOWER_MJS)

    def test_every_import_is_stdlib(self):
        roots = set()
        for node in ast.walk(ast.parse(_source(TOWER_PY))):
            if isinstance(node, ast.Import):
                roots.update(a.name.split(".")[0] for a in node.names)
            elif isinstance(node, ast.ImportFrom):
                if node.level == 0 and node.module:
                    roots.add(node.module.split(".")[0])
        extra = roots - STDLIB_ALLOWED
        self.assertEqual(
            set(), extra,
            "tower.py imports something outside the stdlib allowlist: %s"
            % sorted(extra))

    def test_import_tower_needs_no_pip_install(self):
        proc = subprocess.run(
            [sys.executable, "-S", "-c", "import tower; print(tower.__file__)"],
            env=_child_env(tempfile.gettempdir()),
            stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=60)
        self.assertEqual(0, proc.returncode,
                         proc.stderr.decode("utf-8", "replace"))

    def test_the_public_api_the_callers_import(self):
        """`_spine_common.py` and five spine-* binaries import this module."""
        for name in ("open", "send", "inbox", "cursor_of", "ack", "log"):
            self.assertTrue(callable(getattr(tower, name, None)),
                            "tower.%s is missing or not callable" % name)

    def test_resolve_pane_and_wake_are_out_of_scope(self):
        for name in ("resolvePane", "resolve_pane", "wake"):
            self.assertIsNone(
                getattr(tower, name, None),
                "%s shells out to shepherd and is explicitly out of scope"
                % name)


if __name__ == "__main__":
    unittest.main(verbosity=2)
