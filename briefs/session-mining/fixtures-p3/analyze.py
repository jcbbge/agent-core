#!/usr/bin/env python3
import csv
import json
import re
import statistics
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).parent
SUBCOMMAND_DISPLAY = {
    "git",
    "npm",
    "pnpm",
    "yarn",
    "bun",
    "npx",
    "cargo",
    "docker",
    "gh",
    "herdr",
}


def key_for(row):
    verb = row["verb"] or "[empty]"
    if verb in SUBCOMMAND_DISPLAY and row["subcommand"]:
        return f"{verb} {row['subcommand']}".strip()
    return verb


def metric_table(rows):
    grouped = defaultdict(list)
    for row in rows:
        grouped[key_for(row)].append(row)
    table = []
    for key, members in grouped.items():
        sizes = [int(row["result_bytes"]) for row in members]
        median = int(statistics.median(sizes)) if sizes else 0
        eligible = [
            row
            for row in members
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
        table.append(
            {
                "command": key,
                "calls": len(members),
                "total_bytes": sum(sizes),
                "median_bytes": median,
                "score": len(members) * median,
                "errors": sum(int(row["is_error"]) for row in members),
                "cc_calls": sum(row["harness"] == "cc" for row in members),
                "pi_calls": sum(row["harness"] == "pi" for row in members),
                "compound_calls": sum(int(row["compound"]) for row in members),
                "pipe_calls": sum(int(row["pipe"]) for row in members),
                "oversized_calls": sum(int(row["result_bytes"]) > 50 * 1024 for row in members),
                "eligible_calls": len(eligible),
                "eligible_bytes": sum(int(row["result_bytes"]) for row in eligible),
            }
        )
    return sorted(table, key=lambda item: (item["score"], item["total_bytes"]), reverse=True)


def family(command):
    value = command.lower().strip()
    value = re.sub(r"[0-9a-f]{8}-[0-9a-f-]{27,}", "<uuid>", value)
    value = re.sub(r"/private/tmp/\S+", "<tmp>", value)
    value = re.sub(r"\b\d+\b", "<n>", value)
    value = re.sub(r"(['\"]).*?\1", "<quoted>", value)
    value = re.sub(r"\s+", " ", value)
    return value


def retry_loops(rows):
    exact = defaultdict(list)
    near = defaultdict(list)
    for row in rows:
        exact[(row["harness"], row["session_id"], row["command_norm_sha256"])].append(row)
        near[(row["harness"], row["session_id"], family(row["command_safe"]))].append(row)
    loops = []
    covered = set()
    for (harness, session, _), members in exact.items():
        if len(members) < 3:
            continue
        loop_id = (harness, session, members[0]["command_norm_sha256"])
        covered.add(loop_id)
        loops.append(loop_summary("exact", harness, session, members))
    for (harness, session, _), members in near.items():
        if len(members) < 3:
            continue
        hashes = {row["command_norm_sha256"] for row in members}
        if len(hashes) == 1:
            continue
        loops.append(loop_summary("near", harness, session, members))
    return sorted(loops, key=lambda item: item["repeats"], reverse=True)


def loop_summary(kind, harness, session, members):
    sample = members[0]["command_safe"].replace("\n", " ")[:180]
    return {
        "kind": kind,
        "harness": harness,
        "session_id": session,
        "verb": key_for(members[0]),
        "repeats": len(members),
        "errors": sum(int(row["is_error"]) for row in members),
        "total_bytes": sum(int(row["result_bytes"]) for row in members),
        "sample": sample,
    }


def oversized(rows):
    calls = [
        {
            "harness": row["harness"],
            "batch": int(row["batch"]),
            "session_id": row["session_id"],
            "command": key_for(row),
            "bytes": int(row["result_bytes"]),
            "lines": int(row["result_lines"]),
            "max_line_bytes": int(row["result_max_line_bytes"]),
            "compound": int(row["compound"]),
            "pipe": int(row["pipe"]),
            "sample": row["command_safe"].replace("\n", " ")[:180],
        }
        for row in rows
        if int(row["result_bytes"]) > 50 * 1024
    ]
    return sorted(calls, key=lambda item: item["bytes"], reverse=True)


def main():
    with (ROOT / "commands.csv").open(newline="") as handle:
        rows = list(csv.DictReader(handle))
    selection = json.loads((ROOT / "selection.json").read_text())
    batches_present = sorted({int(row["batch"]) for row in rows})
    batch_tables = {
        str(batch): metric_table([row for row in rows if int(row["batch"]) == batch])
        for batch in batches_present
    }
    merged = metric_table(rows)
    ranks = {
        batch: {item["command"]: rank for rank, item in enumerate(table, start=1)}
        for batch, table in batch_tables.items()
    }
    for item in merged:
        r1 = ranks.get("1", {}).get(item["command"])
        r2 = ranks.get("2", {}).get(item["command"])
        item["batch1_rank"] = r1
        item["batch2_rank"] = r2
        if r1 and r2 and r1 <= 20 and r2 <= 20:
            item["stability"] = "stable" if abs(r1 - r2) <= 5 else "persisted"
        elif r1 and r1 <= 20:
            item["stability"] = "batch1-only"
        elif r2 and r2 <= 20:
            item["stability"] = "batch2-only"
        else:
            item["stability"] = "below-top20"
    report = {
        "csv_schema": list(rows[0].keys()) if rows else [],
        "row_count": len(rows),
        "session_ids": {
            harness: {
                batch: [item["session_id"] for item in sessions]
                for batch, sessions in batches.items()
            }
            for harness, batches in selection.items()
        },
        "batch_tables": {batch: table[:50] for batch, table in batch_tables.items()},
        "merged_table": merged[:100],
        "retry_loops": retry_loops(rows),
        "oversized_results": oversized(rows),
        "summary": {
            "calls_by_harness": dict(Counter(row["harness"] for row in rows)),
            "calls_by_batch": dict(Counter(row["batch"] for row in rows)),
            "errors": sum(int(row["is_error"]) for row in rows),
            "missing_results": sum(int(row["result_missing"]) for row in rows),
            "compound_calls": sum(int(row["compound"]) for row in rows),
            "pipe_calls": sum(int(row["pipe"]) for row in rows),
            "machine_format_calls": sum(int(row["machine_format"]) for row in rows),
        },
    }
    output = ROOT / "analysis.json"
    output.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n")
    print(
        json.dumps(
            {
                "rows": report["row_count"],
                "top": report["batch_tables"].get(str(max(batches_present)), [{}])[0].get(
                    "command"
                ),
                "oversized": len(report["oversized_results"]),
                "retry_loops": len(report["retry_loops"]),
            },
            sort_keys=True,
        )
    )


if __name__ == "__main__":
    main()
