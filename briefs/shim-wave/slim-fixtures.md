# slim frozen-fixture differential tests

Mission: slim's test suite (primitives/tools/slim/) carries 2 SKIPs —
T-DIFF-GS and T-DIFF-GL — because differential tests against a live repo
drift between invocations. Replace them with frozen-fixture variants: build
a tiny throwaway git repo fixture (deterministic commits, authors, dates via
GIT_AUTHOR_DATE/GIT_COMMITTER_DATE env pinning) under test/fixtures/, run
slim git status / git log against it, and assert against golden outputs.
The rtk oracle is GONE from this machine — the goldens are generated once
from slim itself and reviewed by eye for the truth-law invariants (counts
match the fixture's known state; truncation markers correct), then frozen.
Done when: zig build test exit 0 with ZERO skips · the fixture builds
deterministically twice with identical goldens · truth-law invariants
asserted (exit-code propagation on a nonzero-exit git call, raw passthrough
on an unparseable input case).
Partition: primitives/tools/slim/ only.
Board topic: agent-core/slim-fixtures. On full verification write
~/agent-core/briefs/shim-wave/done/slim-fixtures.done (LAST action).
