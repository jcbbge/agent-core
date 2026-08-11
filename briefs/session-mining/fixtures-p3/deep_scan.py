#!/usr/bin/env python3
import argparse
import csv
import json
import re
import shlex
from collections import Counter, defaultdict
from pathlib import Path

from analyze import key_for
from mining_common import text_content

ROOT = Path(__file__).parent


def failure_category(result):
    text = result.lower()
    checks = [
        ("command-not-found", r"command not found|not recognized as an internal"),
        ("no-such-file", r"no such file or directory|cannot access|could not open"),
        ("permission-denied", r"permission denied|operation not permitted|workspace trust"),
        ("unknown-option", r"unknown option|unrecognized option|invalid option|unknown flag"),
        ("syntax-error", r"syntax error|unexpected token|parse error"),
        ("timeout", r"timed out|timeout"),
        ("connection", r"connection refused|could not connect|failed to connect"),
        ("test-failure", r"\bfailed\b|tests? failed|assertionerror|expect\("),
        ("not-running", r"not running|no process|no matching process"),
    ]
    for category, pattern in checks:
        if re.search(pattern, text):
            return category
    return "generic-error"


def compact_bytes(result):
    lines = result.splitlines(keepends=True)
    seen = set()
    deduped = []
    for line in lines:
        if line.strip() and line in seen:
            continue
        if line.strip():
            seen.add(line)
        deduped.append(line)
    capped = lines if len(lines) <= 200 else lines[:100] + lines[-100:]
    return (
        len("".join(deduped).encode("utf-8", errors="replace")),
        len("".join(capped).encode("utf-8", errors="replace")),
    )


def hook_label(command):
    try:
        tokens = shlex.split(command)
    except ValueError:
        tokens = command.split()
    if not tokens:
        return "[unknown]"
    first = Path(tokens[0]).name
    if first in {"node", "bun", "python", "python3", "bash", "zsh"}:
        script = next((token for token in tokens[1:] if not token.startswith("-")), "")
        if script:
            return Path(script).name
    return first


def scan_cc(path, wanted, hook_metrics):
    results = {}
    with Path(path).open(errors="replace") as handle:
        for line in handle:
            try:
                row = json.loads(line)
            except json.JSONDecodeError:
                continue
            if row.get("type") == "system":
                hook_metrics["events"] += int(row.get("hookCount") or 0)
                hook_metrics["prevented"] += int(bool(row.get("preventedContinuation")))
                hook_metrics["error_items"] += len(row.get("hookErrors") or [])
                for info in row.get("hookInfos") or []:
                    duration = info.get("durationMs") if isinstance(info, dict) else None
                    if isinstance(duration, (int, float)):
                        label = hook_label(str(info.get("command") or ""))
                        hook_metrics["duration_ms"] += duration
                        hook_metrics["slow_over_1s"] += int(duration > 1000)
                        hook_metrics[f"command_calls:{label}"] += 1
                        hook_metrics[f"command_ms:{label}"] += duration
                        hook_metrics[f"command_slow:{label}"] += int(duration > 1000)
            message = row.get("message", {})
            if not isinstance(message, dict):
                continue
            content = message.get("content")
            items = content if isinstance(content, list) else [content]
            for item in items:
                if not isinstance(item, dict) or item.get("type") != "tool_result":
                    continue
                call_id = item.get("tool_use_id", "")
                if call_id in wanted:
                    results[call_id] = text_content(item.get("content"))
    return results


def scan_pi(path, wanted):
    results = {}
    with Path(path).open(errors="replace") as handle:
        for line in handle:
            try:
                row = json.loads(line)
            except json.JSONDecodeError:
                continue
            message = row.get("message", {})
            if not isinstance(message, dict) or message.get("role") != "toolResult":
                continue
            if message.get("toolName") != "bash":
                continue
            call_id = message.get("toolCallId", "")
            if call_id in wanted:
                results[call_id] = text_content(message.get("content"))
    return results


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--batch", type=int, choices=(1, 2), required=True)
    args = parser.parse_args()
    with (ROOT / "commands.csv").open(newline="") as handle:
        rows = [
            row for row in csv.DictReader(handle) if int(row["batch"]) == args.batch
        ]
    selection = json.loads((ROOT / "selection.json").read_text())
    by_session = defaultdict(dict)
    for row in rows:
        by_session[(row["harness"], row["session_id"])][row["call_id"]] = row
    outputs = {}
    hook_metrics = Counter()
    for harness in ("cc", "pi"):
        for selected in selection[harness][str(args.batch)]:
            wanted = by_session.get((harness, selected["session_id"]), {})
            if not wanted:
                continue
            if harness == "cc":
                found = scan_cc(selected["path"], wanted, hook_metrics)
            else:
                found = scan_pi(selected["path"], wanted)
            outputs.update(
                {
                    (harness, selected["session_id"], call_id): result
                    for call_id, result in found.items()
                }
            )
    failures = Counter()
    failure_verbs = defaultdict(Counter)
    failure_sessions = defaultdict(set)
    potential = defaultdict(Counter)
    for row in rows:
        result = outputs.get((row["harness"], row["session_id"], row["call_id"]), "")
        key = key_for(row)
        if int(row["is_error"]):
            category = failure_category(result)
            failures[category] += 1
            failure_verbs[category][key] += 1
            failure_sessions[category].add((row["harness"], row["session_id"]))
        eligible = not any(
            int(row[field])
            for field in (
                "compound",
                "pipe",
                "heredoc",
                "substitution",
                "machine_format",
            )
        )
        if eligible:
            deduped, capped = compact_bytes(result)
            potential[key]["calls"] += 1
            potential[key]["raw_bytes"] += len(result.encode("utf-8", errors="replace"))
            potential[key]["deduped_bytes"] += deduped
            potential[key]["cap200_bytes"] += capped
    report = {
        "batch": args.batch,
        "failure_categories": [
            {
                "category": category,
                "errors": count,
                "sessions": len(failure_sessions[category]),
                "top_verbs": failure_verbs[category].most_common(10),
            }
            for category, count in failures.most_common()
        ],
        "hook_metrics_cc": {
            key: value
            for key, value in hook_metrics.items()
            if not key.startswith("command_")
        },
        "hook_commands_cc": [
            {
                "command": label,
                "calls": hook_metrics[f"command_calls:{label}"],
                "duration_ms": hook_metrics[f"command_ms:{label}"],
                "slow_over_1s": hook_metrics[f"command_slow:{label}"],
            }
            for label in sorted(
                (
                    key.removeprefix("command_calls:")
                    for key in hook_metrics
                    if key.startswith("command_calls:")
                ),
                key=lambda item: hook_metrics[f"command_ms:{item}"],
                reverse=True,
            )
        ],
        "eligible_filter_potential": [
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
            )
        ],
    }
    output = ROOT / f"deep-batch{args.batch}.json"
    output.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n")
    print(
        json.dumps(
            {
                "batch": args.batch,
                "errors": sum(failures.values()),
                "categories": len(failures),
                "hook_events": hook_metrics["events"],
            },
            sort_keys=True,
        )
    )


if __name__ == "__main__":
    main()
