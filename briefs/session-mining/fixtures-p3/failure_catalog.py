#!/usr/bin/env python3
import csv
import json
from collections import Counter, defaultdict
from pathlib import Path

from analyze import family, key_for
from deep_scan import failure_category, scan_cc, scan_pi

ROOT = Path(__file__).parent


def main():
    with (ROOT / "commands.csv").open(newline="") as handle:
        rows = list(csv.DictReader(handle))
    selection = json.loads((ROOT / "selection.json").read_text())
    by_session = defaultdict(dict)
    for row in rows:
        if int(row["is_error"]):
            by_session[(row["harness"], row["session_id"])][row["call_id"]] = row

    results = {}
    for harness in ("cc", "pi"):
        for sessions in selection[harness].values():
            for selected in sessions:
                wanted = by_session.get((harness, selected["session_id"]), {})
                if not wanted:
                    continue
                if harness == "cc":
                    found = scan_cc(selected["path"], wanted, Counter())
                else:
                    found = scan_pi(selected["path"], wanted)
                results.update(
                    {
                        (harness, selected["session_id"], call_id): result
                        for call_id, result in found.items()
                    }
                )

    categories = Counter()
    category_sessions = defaultdict(set)
    category_commands = defaultdict(Counter)
    category_command_sessions = defaultdict(set)
    families = defaultdict(
        lambda: {
            "calls": 0,
            "errors": 0,
            "sessions": set(),
            "error_sessions": set(),
            "categories": Counter(),
        }
    )
    for row in rows:
        command_family = family(row["command_safe"])
        state = families[command_family]
        session = (row["harness"], row["session_id"])
        state["calls"] += 1
        state["sessions"].add(session)
        if not int(row["is_error"]):
            continue
        result = results.get((row["harness"], row["session_id"], row["call_id"]), "")
        category = failure_category(result)
        key = key_for(row)
        state["errors"] += 1
        state["error_sessions"].add(session)
        state["categories"][category] += 1
        categories[category] += 1
        category_sessions[category].add(session)
        category_commands[category][key] += 1
        category_command_sessions[(category, key)].add(session)

    focus_categories = (
        "command-not-found",
        "unknown-option",
        "no-such-file",
        "permission-denied",
        "syntax-error",
        "timeout",
        "connection",
    )
    focus = {}
    for category in focus_categories:
        focus[category] = {
            "errors": categories[category],
            "sessions": len(category_sessions[category]),
            "commands": [
                {
                    "command": command,
                    "errors": errors,
                    "sessions": len(category_command_sessions[(category, command)]),
                }
                for command, errors in category_commands[category].most_common()
            ],
        }

    consistent = []
    for command_family, state in families.items():
        if len(state["error_sessions"]) < 2:
            continue
        if state["errors"] != state["calls"]:
            continue
        consistent.append(
            {
                "family": command_family[:220],
                "calls": state["calls"],
                "errors": state["errors"],
                "sessions": len(state["error_sessions"]),
                "categories": dict(state["categories"]),
            }
        )
    consistent.sort(key=lambda item: (item["sessions"], item["errors"]), reverse=True)

    report = {
        "errors": sum(categories.values()),
        "categories": dict(categories),
        "focus": focus,
        "consistent_across_sessions": consistent,
    }
    target = ROOT / "failure-catalog.json"
    target.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n")
    print(
        json.dumps(
            {
                "errors": report["errors"],
                "consistent_families": len(consistent),
                "missing_binary_errors": focus["command-not-found"]["errors"],
                "wrong_flag_errors": focus["unknown-option"]["errors"],
                "dead_path_errors": focus["no-such-file"]["errors"],
            },
            sort_keys=True,
        )
    )


if __name__ == "__main__":
    main()
