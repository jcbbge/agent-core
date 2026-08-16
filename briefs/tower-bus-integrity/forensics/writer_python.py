# Mimics herdr-spine/bin/spine-claim board_append() BEFORE commit 25c1ef0 (2026-08-13): no flock.
import sys, json, time, os
path, id_, from_, topic, body = sys.argv[1:6]
entry = {"id": id_, "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
         "cwd": os.getcwd(), "type": "finding", "from": from_, "topic": topic, "body": body}
with open(path, "a") as fh:
    fh.write(json.dumps(entry) + "\n")    # Python default separators: spaced — "topic": "value"
