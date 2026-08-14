#!/usr/bin/env python3
import argparse
import json
from pathlib import Path

from mining_common import append_rows, exit_code_from, make_row, text_content


def extract(selected, batch):
    calls = []
    results = {}
    path = Path(selected["path"])
    session_cwd = selected["project_key"]
    with path.open(errors="replace") as handle:
        for line in handle:
            try:
                row = json.loads(line)
            except json.JSONDecodeError:
                continue
            if row.get("type") == "session" and isinstance(row.get("cwd"), str):
                session_cwd = row["cwd"]
            message = row.get("message", {})
            if not isinstance(message, dict):
                continue
            role = message.get("role")
            content = message.get("content")
            items = content if isinstance(content, list) else [content]
            if role == "assistant":
                for item in items:
                    if not isinstance(item, dict):
                        continue
                    if item.get("type") != "toolCall" or item.get("name") != "bash":
                        continue
                    command = item.get("arguments", {}).get("command")
                    if isinstance(command, str):
                        calls.append(
                            {
                                "id": item.get("id", ""),
                                "command": command,
                                "cwd": session_cwd,
                            }
                        )
            elif role == "toolResult" and message.get("toolName") == "bash":
                call_id = message.get("toolCallId", "")
                result = text_content(content)
                details = message.get("details")
                is_error = bool(message.get("isError"))
                results[call_id] = {
                    "result": result,
                    "details": details,
                    "is_error": is_error,
                }
    rows = []
    for ordinal, call in enumerate(calls, start=1):
        matched = results.get(call["id"])
        result = matched["result"] if matched else ""
        details = matched["details"] if matched else None
        exit_code = exit_code_from(result, details)
        is_error = matched["is_error"] if matched else False
        if exit_code != "" and exit_code != 0:
            is_error = True
        rows.append(
            make_row(
                harness="pi",
                batch=batch,
                selected=selected,
                call_id=call["id"],
                ordinal=ordinal,
                command=call["command"],
                result=result,
                exit_code=exit_code,
                is_error=is_error,
                result_missing=matched is None,
                cwd=call["cwd"],
            )
        )
    return rows


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--batch", type=int, choices=(1, 2), required=True)
    args = parser.parse_args()
    root = Path(__file__).parent
    selection = json.loads((root / "selection.json").read_text())
    selected = selection["pi"][str(args.batch)]
    rows = []
    session_counts = {}
    for session in selected:
        extracted = extract(session, args.batch)
        rows.extend(extracted)
        session_counts[session["session_id"]] = len(extracted)
    append_rows(root / "commands.csv", rows)
    summary = {
        "harness": "pi",
        "batch": args.batch,
        "sessions": session_counts,
        "commands": len(rows),
    }
    output = root / f"pi-batch{args.batch}-extract.json"
    output.write_text(json.dumps(summary, indent=2, sort_keys=True) + "\n")
    print(json.dumps(summary, sort_keys=True))


if __name__ == "__main__":
    main()
