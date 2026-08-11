#!/usr/bin/env python3
import csv
import shutil
from pathlib import Path

ROOT = Path(__file__).parent
TARGET = Path("/Users/jrg/agent-core/briefs/session-mining/fixtures-p3")
COPY_FILES = (
    "selection.json",
    "cc-batch1-extract.json",
    "pi-batch1-extract.json",
    "cc-batch2-extract.json",
    "pi-batch2-extract.json",
    "analysis.json",
    "deep-batch1.json",
    "deep-batch2.json",
    "insights.json",
    "failure-catalog.json",
    "pass3-section.md",
    "select_sessions.py",
    "extract_cc.py",
    "extract_pi.py",
    "mining_common.py",
    "analyze.py",
    "deep_scan.py",
    "insight_summary.py",
    "failure_catalog.py",
    "export_fixtures.py",
    "verify_pass3.py",
)


def export_sanitized_commands():
    source = ROOT / "commands.csv"
    target = TARGET / "commands.csv"
    with source.open(newline="") as input_handle:
        reader = csv.DictReader(input_handle)
        fields = [field for field in reader.fieldnames or [] if field != "source_path"]
        with target.open("w", newline="") as output_handle:
            writer = csv.DictWriter(output_handle, fieldnames=fields)
            writer.writeheader()
            for row in reader:
                row["command"] = row["command_safe"]
                row.pop("source_path", None)
                writer.writerow({field: row[field] for field in fields})


def main():
    if not TARGET.is_dir():
        raise SystemExit(f"missing fixture directory: {TARGET}")
    export_sanitized_commands()
    for name in COPY_FILES:
        shutil.copy2(ROOT / name, TARGET / name)
    print(f"exported {len(COPY_FILES) + 1} fixtures to {TARGET}")


if __name__ == "__main__":
    main()
