import csv
import hashlib
import re
import shlex
from pathlib import Path

FIELDS = [
    "harness",
    "batch",
    "session_id",
    "cwd",
    "project_key",
    "source_path",
    "call_id",
    "ordinal",
    "command",
    "command_safe",
    "command_sha256",
    "command_norm_sha256",
    "first_token",
    "verb",
    "subcommand",
    "compound",
    "pipe",
    "heredoc",
    "substitution",
    "machine_format",
    "result_bytes",
    "result_lines",
    "result_nonempty_lines",
    "result_unique_lines",
    "result_max_line_bytes",
    "result_sha256",
    "exit_code",
    "is_error",
    "result_missing",
]

SUBCOMMAND_VERBS = {
    "git",
    "npm",
    "pnpm",
    "yarn",
    "bun",
    "npx",
    "python",
    "python3",
    "pytest",
    "cargo",
    "docker",
    "gh",
    "herdr",
    "rtk",
}
GIT_OPTIONS_WITH_VALUE = {
    "-C",
    "-c",
    "--git-dir",
    "--work-tree",
    "--namespace",
    "--exec-path",
    "--config-env",
}
BUN_SUBCOMMANDS = {
    "add",
    "build",
    "create",
    "install",
    "link",
    "outdated",
    "pm",
    "publish",
    "remove",
    "run",
    "test",
    "unlink",
    "update",
    "upgrade",
    "x",
}
MACHINE_FLAGS = {
    "--porcelain",
    "--format",
    "--json",
    "-0",
    "-c",
}
SECRET_PATTERNS = [
    re.compile(r"(?i)\b(api[_-]?key|token|password|secret|authorization)\s*=\s*([^\s]+)"),
    re.compile(r"(?i)(bearer\s+)[A-Za-z0-9._~+/=-]+"),
    re.compile(r"\b(?:sk|ghp|github_pat|xox[baprs])[-_][A-Za-z0-9_-]{12,}\b"),
]


def text_content(content):
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        chunks = []
        for item in content:
            if isinstance(item, str):
                chunks.append(item)
            elif isinstance(item, dict) and isinstance(item.get("text"), str):
                chunks.append(item["text"])
        return "\n".join(chunks)
    if content is None:
        return ""
    return str(content)


def redact(command):
    safe = command
    for pattern in SECRET_PATTERNS:
        if pattern.groups >= 2:
            safe = pattern.sub(lambda match: f"{match.group(1)}=[REDACTED]", safe)
        elif pattern.groups == 1:
            safe = pattern.sub(lambda match: f"{match.group(1)}[REDACTED]", safe)
        else:
            safe = pattern.sub("[REDACTED]", safe)
    return safe[:500]


def shell_tokens(command):
    try:
        return shlex.split(command, posix=True)
    except ValueError:
        return command.strip().split()


def classify(command):
    tokens = shell_tokens(command)
    index = 0
    while index < len(tokens) and re.match(r"^[A-Za-z_][A-Za-z0-9_]*=", tokens[index]):
        index += 1
    if index < len(tokens) and tokens[index] == "env":
        index += 1
        while index < len(tokens) and (
            tokens[index].startswith("-")
            or re.match(r"^[A-Za-z_][A-Za-z0-9_]*=", tokens[index])
        ):
            index += 1
    if index < len(tokens) and tokens[index] == "sudo":
        index += 1
        while index < len(tokens) and tokens[index].startswith("-"):
            index += 1
    first = tokens[index] if index < len(tokens) else ""
    verb = Path(first).name if first else ""
    subcommand = ""
    if verb in SUBCOMMAND_VERBS:
        remaining = tokens[index + 1 :]
        candidate = ""
        skip_next = False
        for token in remaining:
            if token in {"&&", "||", ";", "|"}:
                break
            if skip_next:
                skip_next = False
                continue
            if verb == "git" and token in GIT_OPTIONS_WITH_VALUE:
                skip_next = True
                continue
            if token.startswith("-") or re.match(r"^[A-Za-z_][A-Za-z0-9_]*=", token):
                continue
            candidate = token
            break
        if verb == "bun" and candidate and candidate not in BUN_SUBCOMMANDS:
            subcommand = "[script]"
        else:
            subcommand = candidate
    normalized = re.sub(r"\s+", " ", command.strip())
    return {
        "first_token": first,
        "verb": verb,
        "subcommand": subcommand,
        "compound": int(
            "\n" in command
            or bool(re.search(r"(^|[^|&])(?:&&|\|\||;)(?=$|\s)", command))
        ),
        "pipe": int(bool(re.search(r"(^|[^|])\|(?=[^|]|$)", command))),
        "heredoc": int("<<" in command),
        "substitution": int("$(" in command or "`" in command),
        "machine_format": int(any(flag in tokens for flag in MACHINE_FLAGS)),
        "command_norm_sha256": hashlib.sha256(normalized.encode()).hexdigest(),
    }


def exit_code_from(result, structured=None):
    if isinstance(structured, dict):
        for key in ("exitCode", "exit_code", "code"):
            value = structured.get(key)
            if isinstance(value, int):
                return value
    patterns = [
        r"(?:^|\n)Exit code:\s*(-?\d+)\b",
        r"(?:^|\n)Process exited with code\s+(-?\d+)\b",
        r"(?:^|\n)Command failed with exit code\s+(-?\d+)\b",
    ]
    for pattern in patterns:
        match = re.search(pattern, result, re.IGNORECASE)
        if match:
            return int(match.group(1))
    return ""


def result_metrics(result):
    encoded = result.encode("utf-8", errors="replace")
    lines = result.splitlines()
    nonempty = [line for line in lines if line.strip()]
    return {
        "result_bytes": len(encoded),
        "result_lines": len(lines),
        "result_nonempty_lines": len(nonempty),
        "result_unique_lines": len(set(nonempty)),
        "result_max_line_bytes": max(
            (len(line.encode("utf-8", errors="replace")) for line in lines), default=0
        ),
        "result_sha256": hashlib.sha256(encoded).hexdigest(),
    }


def make_row(
    *,
    harness,
    batch,
    selected,
    call_id,
    ordinal,
    command,
    result,
    exit_code,
    is_error,
    result_missing,
    cwd,
):
    row = {
        "harness": harness,
        "batch": batch,
        "session_id": selected["session_id"],
        "cwd": cwd or selected["project_key"],
        "project_key": selected["project_key"],
        "source_path": selected["path"],
        "call_id": call_id,
        "ordinal": ordinal,
        "command": command,
        "command_safe": redact(command),
        "command_sha256": hashlib.sha256(command.encode()).hexdigest(),
        "exit_code": exit_code,
        "is_error": int(bool(is_error)),
        "result_missing": int(bool(result_missing)),
    }
    row.update(classify(command))
    row.update(result_metrics(result))
    return row


def append_rows(output: Path, rows):
    exists = output.exists() and output.stat().st_size > 0
    with output.open("a", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=FIELDS)
        if not exists:
            writer.writeheader()
        writer.writerows(rows)
