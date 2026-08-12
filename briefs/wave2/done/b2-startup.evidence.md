# AGNT B2 — `[[startup]]` stanza lab proof + landing

Verdict: **`[[startup]] lab: yes`** — a plugin `[[startup]]` stanza fires at the
installed herdr 0.8.0 (event=startup, exit 0) and restored CTRL + TOWR panes in
an isolated lab session.

## Environment (verified)
- `herdr 0.8.0` installed (`herdr --version`).
- Source `~/source/herdr` at tag `v0.8.0` (`git describe --tags` = `v0.8.0`,
  HEAD `346411f release: v0.8.0`) — source matches the running binary.

## Source proof (the pre-verified fact, re-confirmed)
- `~/source/herdr/src/app/api/plugins/manifest.rs`: `RawPluginManifest`
  declares `startup: Vec<RawPluginManifestStartup>` with `#[serde(default)]`
  (line 25), a `RawPluginManifestStartup { platforms, command }` struct
  (44-48), and it is normalized into `InstalledPluginInfo.startup` (163-167,
  219). The prior repo claim that no `startup` field exists at 0.8.0 was FALSE.
- Execution wiring: `src/app/api/plugins/runtime.rs` `run_plugin_startup_hooks()`
  iterates enabled plugins with non-empty `startup` and runs each command with
  invocation source `"startup"`.
- Called at boot: `src/server/headless.rs` calls
  `server.app.run_plugin_startup_hooks()` on the normal server start path
  (~4736) AND on handoff import (~4839). Registry loads at boot:
  `src/app/mod.rs:671` `installed_plugins: load_plugin_registry(...)`.
- CHANGELOG 0.8.0 "Added": "one-shot plugin `[[startup]]` hooks for restoring
  plugin-owned state after server startup and live handoff."

## Lab (isolated, real registry never touched)
- Tripwire captured on the real default BEFORE any lab work
  (`bin/spine-lab tripwire`, 31425 bytes).
- The tool shell runs INSIDE a herdr pane (`HERDR_SOCKET_PATH=.../herdr.sock`,
  `HERDR_ENV=1`). A first `plugin link` under only `XDG_CONFIG_HOME` LEAKED into
  the real default server's registry because the CLI honors `HERDR_SOCKET_PATH`.
  Caught immediately via grep of the real `plugins.json`, `plugin unlink`ed at
  once (real registry grep count back to 0). The startup hook never ran on the
  real server (hooks fire only at boot, which was never triggered).
- Fix / isolation method: run every lab command with the pane socket/env
  scrubbed AND a sandbox config dir —
  `env -u HERDR_SOCKET_PATH -u HERDR_ENV -u HERDR_PANE_ID -u HERDR_TAB_ID
  -u HERDR_WORKSPACE_ID XDG_CONFIG_HOME=<sandbox>/xdg`. This sandboxes
  `plugins.json`, sessions, and sockets. Real registry stayed clean thereafter.
- Lab session: `spine-lab-startup-b2` (started via `bin/spine-lab start`),
  a throwaway plugin `spine-lab-startup-b2` linked offline into the sandbox
  registry with a `[[startup]]` stanza `command = ["python3","spine-lab-boot.py"]`.
- `plugin link` response retained the stanza — schema-level proof:
  `"startup":[{"command":["python3","spine-lab-boot.py"],"platforms":["macos"]}]`.

### Live proof (server log + plugin log + snapshot)
- Server log (`.../sessions/spine-lab-startup-b2/herdr-server.log`) on boot:
  `workspace.create` -> `pane.rename` (CTRL) -> `pane.split` -> `pane.rename`
  (TOWR) -> `session saved ... workspaces=1`. These API calls originate from the
  startup hook (the only actor at boot).
- `plugin log list --plugin spine-lab-startup-b2` (server alive):
  `event: "startup"`, `exit_code: 0`, `status: "succeeded"`, stderr:
  ```
  [spine-lab-boot] B2-LAB-STARTUP-FIRED event=startup plugin=spine-lab-startup-b2
  [spine-lab-boot] renamed w1:p1 -> CTRL
  [spine-lab-boot] renamed w1:p2 -> TOWR
  [spine-lab-boot] ensure complete: CTRL=w1:p1 TOWR=w1:p2
  ```
- `pane list` in the lab: `w1:p1 -> 'CTRL'`, `w1:p2 -> 'TOWR'`.
- Lab session stopped + deleted via `bin/spine-lab delete spine-lab-startup-b2`.

## Landed in the real repo (takes effect on NEXT real restart; live server NOT restarted)
- `herdr-plugin.toml`: added `[[startup]] command = ["python3","bin/spine-startup"]`,
  `platforms = ["macos"]`. Corrected the FALSE header + trailer comments that
  claimed `[[startup]]` was "silently dropped at parse" / "never ran once" at
  0.8.0. `min_herdr_version` kept `"0.7.4"` (stanza inert on pre-0.8.0, live on
  0.8.0, so the `[[events]]` path stays loadable on older binaries). Re-parsed
  via herdr (offline, sandbox): startup stanza present, no warnings.
- `bin/spine-startup`: rewritten from the deprecated agent-view seeder into an
  idempotent CTRL/TOWR ensure (python3 stdlib, exits 0 always, non-fatal).
  CTRL: reattach an existing `CTRL` pane's renderer (`pane run ... bun
  bin/ctl-fleet`) or `bun bin/ctl-fleet --spawn` on a cold boot. TOWR: ensure
  `TOWR <basename HERDR_PLUGIN_ROOT>` (split tab 1 + `twr.ts <root>`), other
  projects' TOWR panes untouched. `python3 -m py_compile` clean.
- `docs/plugin.md`: corrected the startup section — startup is supported at
  0.8.0 (source + lab proof), now restores CTRL/TOWR; the agent view stays on
  the `[[events]]` path (`bin/handlers/15-restore-view`), not startup.

## Verification boundary (honest)
- The `[[startup]]` MECHANISM and the list/split/rename/run primitives are
  lab-proven at 0.8.0. The composed CTRL/TOWR recipe in the LANDED
  `bin/spine-startup` (ctl-fleet / twr.ts) was NOT run against a real restart on
  purpose — that would spawn real fleet panes in the live default session. It
  takes effect on the next real server start, which this worker did not trigger.

## Tripwire-check (default topology) — NOT a clean PASS; ambient, not a lab leak
- `bin/spine-lab tripwire-check` returned FAIL with ONLY a removal:
  `REMOVED tab w1M:t6 'wave2-consolidation'`, `REMOVED pane w1M:pD 'ORCH
  wave2-consolidation'` (a sibling pane in this worker's own workspace `w1M`,
  closed by ambient fleet activity during the run).
- A structural diff of the tripwire before/after shows `ANY_ADDED: False` and
  zero `CTRL`/`TOWR` panes in the default session — the lab added nothing to the
  default. The lab was fully isolated (sandbox XDG; real registry stayed clean).
  Conclusion: the FAIL is ambient drift by another actor (the documented
  false-positive class), not a leak from this lab.
