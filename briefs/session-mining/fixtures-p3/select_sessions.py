#!/usr/bin/env python3
import csv
import json
import time
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path

MIN_SIZE = 100 * 1024
CUTOFF = time.time() - 30 * 60
PER_HARNESS_PER_BATCH = 5
BATCHES = 2
PRIOR = Path(
    "/private/tmp/claude-501/-Users-jrg/"
    "de008bc7-28c8-4fb1-b78f-8f99be78c736/scratchpad/mining"
)


def prior_ids():
    excluded = set()
    with (PRIOR / "commands.csv").open(newline="") as handle:
        excluded.update(row["session_id"] for row in csv.DictReader(handle))
    selection = json.loads((PRIOR / "selection.json").read_text())
    for batches in selection.values():
        for sessions in batches.values():
            excluded.update(item["session_id"] for item in sessions)
    return excluded


def eligible(root: Path, excluded):
    rows = []
    for path in root.glob("*/*.jsonl"):
        stat = path.stat()
        project = path.parent.name
        if stat.st_size <= MIN_SIZE or stat.st_mtime >= CUTOFF:
            continue
        if "private-tmp" in project:
            continue
        if path.stem in excluded:
            continue
        prefix = "--Users-jrg-" if project.startswith("--Users-jrg-") else "-Users-jrg-"
        suffix = project[len(prefix) :] if project.startswith(prefix) else ""
        rows.append(
            {
                "path": str(path),
                "session_id": path.stem,
                "project_key": project,
                "real_project": bool(suffix.strip("-")),
                "mtime": stat.st_mtime,
                "mtime_utc": datetime.fromtimestamp(
                    stat.st_mtime, tz=timezone.utc
                ).isoformat(),
                "file_bytes": stat.st_size,
            }
        )
    return rows


def diverse_order(rows):
    preferred = [row for row in rows if row["real_project"]]
    fallback = [row for row in rows if not row["real_project"]]
    preferred.sort(key=lambda row: row["mtime"], reverse=True)
    fallback.sort(key=lambda row: row["mtime"], reverse=True)
    ordered = []
    for pool in (preferred, fallback):
        groups = defaultdict(list)
        for row in pool:
            groups[row["project_key"]].append(row)
        keys = sorted(groups, key=lambda key: groups[key][0]["mtime"], reverse=True)
        depth = 0
        while keys:
            next_keys = []
            for key in keys:
                group = groups[key]
                if depth < len(group):
                    ordered.append(group[depth])
                if depth + 1 < len(group):
                    next_keys.append(key)
            keys = next_keys
            depth += 1
    return ordered


def main():
    excluded = prior_ids()
    roots = {
        "cc": Path.home() / ".claude/projects",
        "pi": Path.home() / ".pi/agent/sessions",
    }
    selection = {}
    needed = PER_HARNESS_PER_BATCH * BATCHES
    for harness, root in roots.items():
        rows = diverse_order(eligible(root, excluded))
        if len(rows) < needed:
            raise SystemExit(f"{harness}: need {needed} eligible sessions, found {len(rows)}")
        selection[harness] = {
            str(batch): rows[
                (batch - 1) * PER_HARNESS_PER_BATCH : batch
                * PER_HARNESS_PER_BATCH
            ]
            for batch in range(1, BATCHES + 1)
        }

    selected_ids = [
        item["session_id"]
        for batches in selection.values()
        for sessions in batches.values()
        for item in sessions
    ]
    overlap = sorted(excluded.intersection(selected_ids))
    if overlap:
        raise SystemExit(f"prior-session overlap: {overlap}")
    if len(selected_ids) != len(set(selected_ids)):
        raise SystemExit("duplicate session selected")

    output = Path(__file__).with_name("selection.json")
    output.write_text(json.dumps(selection, indent=2, sort_keys=True) + "\n")
    print(
        json.dumps(
            {
                "batches": {
                    batch: {
                        harness: [
                            item["session_id"]
                            for item in selection[harness][batch]
                        ]
                        for harness in ("cc", "pi")
                    }
                    for batch in ("1", "2")
                },
                "excluded_prior_ids": len(excluded),
                "overlap": overlap,
                "selected": len(selected_ids),
            },
            sort_keys=True,
        )
    )


if __name__ == "__main__":
    main()
