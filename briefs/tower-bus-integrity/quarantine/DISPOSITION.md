# Disposition of the 26 damaged board.jsonl rows

Repair performed by AGNT board-repair-swap (task-4-repair), 2026-08-16.
Backup: `briefs/tower-bus-integrity/backups/board.jsonl.20260816T183311Z.bak`
(sha256 `c3c66989cc4cf2e129fceb60fb78cafe9ce6d7a6ab149efd9e1ba6b3596c0c49`,
12575 lines / 6968281 bytes at capture time).

26 in, 26 accounted for: 23 repaired-in-place (45 recovered objects), 3 quarantined.

## Repaired in place (23 lines -> 45 objects)

| Original line | Recovered objects | ids |
|---|---|---|
| 553  | 1 | `t-find-1785206344-w1` |
| 2113 | 1 | `ws1-done-1786216197` |
| 2502 | 2 | `c003-test-runner-claim`, `spine-e144ddea-f494-4c9e-9cf3-d7ffd4d01f22` |
| 2504 | 2 | `c003-test-runner-done`, `spine-ece6cef7-1a07-496e-9f63-b652dbc8785a` |
| 2507 | 3 | `c003-triage-c-claim`, `c003-triage-b-claim`, `spine-59be215f-4787-4554-b97c-61c13f8c474d` |
| 2511 | 2 | `c003-triage-b-done`, `spine-101696fd-66ff-4fe0-88c4-f87837cfc77c` |
| 2513 | 2 | `c003-triage-c-done`, `spine-fe5d2443-11b7-4bc6-ab15-4c2d56694c91` |
| 2514 | 2 | `c003-fix-impl-claim`, `spine-cc714d54-6937-48c7-9f76-d07ae073a015` |
| 2515 | 2 | `c003-fix-impl-done`, `spine-a716ee00-8dad-4dee-b1ec-52a2dac589e3` |
| 2516 | 2 | `c003-fix-tests-claim`, `spine-0c02d9e8-2092-421c-915a-8d1175f768b6` |
| 2521 | 2 | `c003-test-runner-2-claim`, `spine-334c94a7-5a01-4c6e-8c9c-a5efe7561e9e` |
| 2523 | 2 | `c003-test-runner-2-done`, `spine-3a9dea2f-93d6-4f1d-8c17-8e3f6c17263e` |
| 2525 | 2 | `c003-triage-d-claim`, `spine-3cbbb637-544f-43a2-84e6-7c0bbd1fa942` |
| 2527 | 2 | `c003-triage-d-done`, `spine-2d1bb194-b9f0-491c-b6d4-6a04b37b25d8` |
| 2530 | 2 | `c003-fix-impl-2-claim`, `spine-9c5ba7cb-4bf4-4afc-82f4-0190cbcd9648` |
| 2542 | 2 | `c003-triage-e-claim`, `spine-1ce26db1-c437-48eb-a913-5c3cad89491a` |
| 2556 | 2 | `c003-fix-3-claim`, `spine-82246ad7-7bd8-40b7-a16b-047c453afe1e` |
| 2559 | 2 | `c003-fix-3-done`, `spine-c6147e74-0952-4bc0-928b-0a81488f411e` |
| 2569 | 2 | `c003-fix-tests-3-done`, `spine-fa6811a8-dd85-4bcc-8cb0-97f556537cf9` |
| 2571 | 2 | `c003-test-runner-4-3-claim`, `spine-4f67882a-febf-4859-8683-1f5e277bd4c0` |
| 2573 | 2 | `c003-test-runner-4-3-done`, `spine-030dd4fc-397e-4076-b710-02980eb0abdd` |
| 2574 | 2 | `c003-acceptance-claim`, `spine-26001228-c9d9-4e60-a104-b203a752e1c2` |
| 2577 | 2 | `c003-acceptance-done`, `spine-ae62f892-cb3b-4cbe-ac0e-b5385bba2d31` |

Repair method by damage class:

- **unescaped_body** (line 553): a literal, unescaped `"tower ask"` quote pair
  inside the `body` string value broke the parser at the first closing quote.
  Fixed by escaping that quote pair (`\"tower ask\"`). Original `id`, `ts`,
  `from`, `topic`, `cwd`, `type`, and `body` content preserved verbatim.
- **invalid_escape** (line 2113): the body contained `\-`, `\,`, `\)` —
  backslashes preceding characters that are not legal JSON escapes (only
  `" \ / b f n r t u` are legal after `\`). Fixed by stripping the illegal
  backslash from all three occurrences, leaving the literal characters. Row
  content otherwise untouched.
- **concatenated_objects** (20 of the 21 lines in this class: 2502, 2504,
  2511, 2513, 2514, 2515, 2516, 2521, 2523, 2525, 2530, 2542, 2556, 2559,
  2569, 2571, 2573, 2574, 2577, plus 2507 with 3 objects): two (or for 2507,
  three) complete JSON objects were concatenated on one physical line, joined
  by a bare literal `n` (codepoint 110) where a `\n` line separator should
  have been — the backslash was lost. Fixed by splitting at each `}n{`
  boundary into separate, independently-valid lines. No object content was
  altered.
- **concatenated_objects + unescaped_body compound** (line 2527): same bare-`n`
  concatenation as above, but object 1 additionally carried its own internal
  unescaped-quote defect — a literal `("c new")` inside the body prose (same
  disease as line 553). This defect was **not captured** by the prior
  `bus-data/INVENTORY.json`'s single-label `concatenated_objects`
  classification for this line; it required both a split and a quote-escape
  to recover. Fixed by splitting at the bare-`n` boundary, then escaping the
  `("c new")` quote pair in object 1.

## Quarantined (3 lines, unrecoverable as board rows)

Raw content: `briefs/tower-bus-integrity/quarantine/QUARANTINED-board.jsonl`
(3 lines, in original line order: 1, 2, 3).

| Original line | Reason |
|---|---|
| 1 | Not a board row. Literal captured-stdout text `1 matches in 1F:` — no opening `{`, not JSON in any form. Part of a leaked search/grep-tool-output artifact that landed in board.jsonl instead of a proper post. |
| 2 | Not a board row. Literal captured-stdout text `[file] 628 (1):` — same leaked-artifact family as line 1. |
| 3 | Not a board row on its own. Begins `     0: "spine-fddfcbe6-...", "ts": "2026-07-24T09:18:30Z", "cwd` with no opening `{` and is truncated mid-key (`cwd` never closes) — a numbered-line dump format (e.g. `grep -n`-style output), not the underlying JSON line itself. No complete object is recoverable from this fragment. |

These 3 agree with `bus-data/INVENTORY.json`'s classification (`non_json_text`
x2, `truncated` x1) and with ORCH's direct read in the brief. No row content
was invented or guessed; where a defect could be pinpointed and mechanically
undone (missing backslash before a JSON control character, or before a
newline-separator character), it was undone using only the bytes already
present in the row. Where no such row exists (1, 2), or the row is
irrecoverably truncated mid-key with no way to know what followed (3), it was
quarantined rather than fabricated.

## Arithmetic

```
original prefix (lines 1..2577):        2577
quarantined (removed):                    -3
repaired lines removed (26 - 3):         -23
recovered objects (replacing the 23):    +45
                                        ------
repaired prefix (lines 1..2596):         2596      (2577 - 26 + 45 = 2596)

pre_swap_lines  (2577 prefix + 10032 live tail at swap moment):  12609
removed:                                                            26
recovered:                                                          45
appended_during_swap (tail captured atomically with rename, 0 growth):  0
post_swap_lines = 12609 - 26 + 45 + 0 =                          12628
observed lines immediately after rename (2596 + 10032 tail):     12628   MATCH
```

Board has grown further since (live appends continue); re-run
`bun ~/.tower/cli.mjs board agent-core/tower-bus-integrity` for the current
count. Full-file parse after swap (including subsequent growth): see
ORCH/CORD report — `total_nonempty`, `ok`, `bad_count` all reconciled to
`bad_count: 0`.
