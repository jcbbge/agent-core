#!/usr/bin/env python3
import csv
import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).parent
PRIOR = Path(
    "/private/tmp/claude-501/-Users-jrg/"
    "de008bc7-28c8-4fb1-b78f-8f99be78c736/scratchpad/mining"
)
FIXTURES = Path("/Users/jrg/agent-core/briefs/session-mining/fixtures-p3")
REPORT = Path("/Users/jrg/agent-core/research/session-mining-verbs.md")


def main():
    selection = json.loads((ROOT / "selection.json").read_text())
    prior_selection = json.loads((PRIOR / "selection.json").read_text())
    selected = {
        item["session_id"]
        for batches in selection.values()
        for sessions in batches.values()
        for item in sessions
    }
    prior = {
        item["session_id"]
        for batches in prior_selection.values()
        for sessions in batches.values()
        for item in sessions
    }
    assert len(selected) == 20
    assert not selected.intersection(prior)
    for batch in ("1", "2"):
        assert sum(len(selection[harness][batch]) for harness in ("cc", "pi")) == 10
        assert all(len(selection[harness][batch]) == 5 for harness in ("cc", "pi"))

    with (ROOT / "commands.csv").open(newline="") as handle:
        rows = list(csv.DictReader(handle))
    assert len(rows) == 988
    assert Counter(row["batch"] for row in rows) == {"1": 234, "2": 754}
    assert Counter(row["harness"] for row in rows) == {"cc": 618, "pi": 370}
    assert {row["session_id"] for row in rows}.issubset(selected)

    insights = json.loads((ROOT / "insights.json").read_text())
    failures = json.loads((ROOT / "failure-catalog.json").read_text())
    assert insights["eligible_calls"] == 63
    assert insights["eligible_bytes"] == 83181
    assert insights["exact_retry_loops"] == 3
    assert insights["exact_retry_excess_calls"] == 7
    assert failures["errors"] == 85
    assert failures["focus"]["command-not-found"]["errors"] == 0
    assert failures["focus"]["unknown-option"]["errors"] == 0

    with (FIXTURES / "commands.csv").open(newline="") as handle:
        fixture_reader = csv.DictReader(handle)
        assert "source_path" not in (fixture_reader.fieldnames or [])
        fixture_rows = list(fixture_reader)
    assert len(fixture_rows) == 988
    assert all(row["command"] == row["command_safe"] for row in fixture_rows)

    report = REPORT.read_text()
    assert report.count("## Pass 3 (20 sessions)") == 1
    assert "**Pass-3 verdict: HOLDS.**" in report
    required = {
        "analysis.json",
        "commands.csv",
        "failure-catalog.json",
        "insights.json",
        "selection.json",
        "pass3-section.md",
    }
    assert required.issubset(path.name for path in FIXTURES.iterdir())
    print(
        json.dumps(
            {
                "batches": {"1": 10, "2": 10},
                "calls": len(rows),
                "errors": failures["errors"],
                "overlap": 0,
                "report_sections": 1,
                "sessions": len(selected),
                "verdict": "HOLDS",
            },
            sort_keys=True,
        )
    )


if __name__ == "__main__":
    main()
