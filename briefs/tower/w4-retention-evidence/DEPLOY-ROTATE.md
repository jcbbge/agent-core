# Deploy rotate.mjs (ops / CORD — not applied by coder)

Canonical source:

```
~/agent-core/primitives/mcps/tower/rotate.mjs
```

After merge to agent-core main and `agent-core sync` (or manual symlink):

```bash
ln -sf ~/agent-core/primitives/mcps/tower/rotate.mjs ~/.tower/rotate.mjs
```

Verify:

```bash
bun ~/.tower/rotate.mjs --store board --dry-run
```

Do **not** run `--apply` on live until ORCH accepts proof in `rotate-proofs/` and POLICY triggers warrant rotation.
