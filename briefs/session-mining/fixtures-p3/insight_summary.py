#!/usr/bin/env python3
import csv
import json
import re
import statistics
from collections import Counter, defaultdict
from pathlib import Path

from mining_common import classify

ROOT = Path(__file__).parent
SLIM_V1 = {"ls", "ps", "wc", "df"}


def slim_v1_row(row):
    if row["verb"] in SLIM_V1:
        return True
    return row["verb"] == "git" and row["subcommand"] in {"status", "log"}


def merge_deep():
    reports = [
        json.loads((ROOT / f"deep-batch{batch}.json").read_text()) for batch in (1, 2)
    ]
    failures = Counter()
    failure_sessions = defaultdict(set)
    failure_verbs = defaultdict(Counter)
    hooks = Counter()
    hook_commands = defaultdict(Counter)
    potential = defaultdict(Counter)
    for report in reports:
        hooks.update(report["hook_metrics_cc"])
        for item in report.get("hook_commands_cc", []):
            for field in ("calls", "duration_ms", "slow_over_1s"):
                hook_commands[item["command"]][field] += item[field]
        for item in report["failure_categories"]:
            failures[item["category"]] += item["errors"]
            for verb, count in item["top_verbs"]:
                failure_verbs[item["category"]][verb] += count
            failure_sessions[item["category"]].add(
                (report["batch"], item["sessions"])
            )
        for item in report["eligible_filter_potential"]:
            key = item["command"]
            for field in ("calls", "raw_bytes", "deduped_bytes", "cap200_bytes"):
                potential[key][field] += item[field]
    return reports, failures, failure_verbs, hooks, hook_commands, potential


def leading_cd(rows):
    pattern = re.compile(
        r"""^\s*cd\s+(?:--\s+)?(?:'[^']*'|"[^"]*"|\S+)\s*(?:&&|;|\n)\s*(.+)""",
        re.DOTALL,
    )
    downstream = defaultdict(Counter)
    matched = 0
    total_bytes = 0
    for row in rows:
        match = pattern.match(row["command"])
        if not match:
            continue
        matched += 1
        total_bytes += int(row["result_bytes"])
        info = classify(match.group(1))
        key = info["verb"]
        if key in {"git", "npm", "pnpm", "yarn", "bun", "cargo", "docker", "gh"}:
            key = f"{key} {info['subcommand']}".strip()
        downstream[key]["calls"] += 1
        downstream[key]["bytes"] += int(row["result_bytes"])
    ranked = [
        {"command": key, **counts}
        for key, counts in sorted(
            downstream.items(), key=lambda item: item[1]["bytes"], reverse=True
        )
    ]
    return {"calls": matched, "bytes": total_bytes, "top_downstream": ranked[:20]}


def main():
    with (ROOT / "commands.csv").open(newline="") as handle:
        rows = list(csv.DictReader(handle))
    analysis = json.loads((ROOT / "analysis.json").read_text())
    reports, failures, failure_verbs, hooks, hook_commands, potential = merge_deep()
    eligible = [
        row
        for row in rows
        if not any(
            int(row[field])
            for field in (
                "compound",
                "pipe",
                "heredoc",
                "substitution",
                "machine_format",
            )
        )
    ]
    v1 = [row for row in rows if slim_v1_row(row)]
    v1_eligible = [row for row in eligible if slim_v1_row(row)]
    exact_loops = [
        item for item in analysis["retry_loops"] if item["kind"] == "exact"
    ]
    near_loops = [
        item for item in analysis["retry_loops"] if item["kind"] == "near"
    ]
    selection = json.loads((ROOT / "selection.json").read_text())
    calls_by_session = Counter((row["harness"], row["batch"], row["session_id"]) for row in rows)
    zero_shell = {
        harness: {
            batch: sum(
                not calls_by_session[(harness, batch, selected["session_id"])]
                for selected in sessions
            )
            for batch, sessions in batches.items()
        }
        for harness, batches in selection.items()
    }
    output = {
        "calls": len(rows),
        "output_bytes": sum(int(row["result_bytes"]) for row in rows),
        "median_result_bytes": int(
            statistics.median(int(row["result_bytes"]) for row in rows)
        ),
        "max_result_bytes": max(int(row["result_bytes"]) for row in rows),
        "results_over_50kb": sum(int(row["result_bytes"]) > 50 * 1024 for row in rows),
        "eligible_calls": len(eligible),
        "eligible_bytes": sum(int(row["result_bytes"]) for row in eligible),
        "refused_calls": len(rows) - len(eligible),
        "slim_v1_calls": len(v1),
        "slim_v1_eligible_calls": len(v1_eligible),
        "slim_v1_eligible_bytes": sum(int(row["result_bytes"]) for row in v1_eligible),
        "exact_retry_loops": len(exact_loops),
        "exact_retry_excess_calls": sum(item["repeats"] - 1 for item in exact_loops),
        "near_retry_families": len(near_loops),
        "failure_categories": [
            {
                "category": category,
                "errors": count,
                "top_verbs": failure_verbs[category].most_common(8),
            }
            for category, count in failures.most_common()
        ],
        "hook_metrics_cc": dict(hooks),
        "hook_commands_cc": [
            {"command": command, **counts}
            for command, counts in sorted(
                hook_commands.items(),
                key=lambda item: item[1]["duration_ms"],
                reverse=True,
            )
        ],
        "zero_shell_sessions": zero_shell,
        "leading_cd": leading_cd(rows),
        "direct_filter_potential": [
            {
                "command": key,
                **counts,
                "dedupe_savings_pct": round(
                    100 * (1 - counts["deduped_bytes"] / counts["raw_bytes"]), 1
                )
                if counts["raw_bytes"]
                else 0,
                "cap200_savings_pct": round(
                    100 * (1 - counts["cap200_bytes"] / counts["raw_bytes"]), 1
                )
                if counts["raw_bytes"]
                else 0,
            }
            for key, counts in sorted(
                potential.items(), key=lambda item: item[1]["raw_bytes"], reverse=True
            )[:30]
        ],
    }
    target = ROOT / "insights.json"
    target.write_text(json.dumps(output, indent=2, sort_keys=True) + "\n")
    print(target)


if __name__ == "__main__":
    main()
