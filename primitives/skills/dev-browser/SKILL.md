---
name: dev-browser
description: >
  Browser automation, debugging, and UI verification via the dev-browser CLI — console capture, network inspection, JS execution in page context, flow driving with persistent pages, attaching to the user's own Chrome. Use when users ask to navigate/test/debug web apps, check the console, watch network requests, verify a UI change end-to-end, reproduce a browser bug, take screenshots, fill forms, or automate browser workflows. Trigger phrases: "go to [url]", "click on", "check the console", "what's the network doing", "watch the requests", "test the flow", "debug in my browser", "verify in the browser", "take a screenshot", "test the website".
---

# Dev Browser

One CLI, one daemon, **one browser**. Scripts run in a sandboxed QuickJS runtime with a
preconnected `browser` global. Pages are **full Playwright Page objects** — the entire
Playwright API works (goto, click, fill, locator, evaluate, event listeners):
https://playwright.dev/docs/api/class-page

Named pages (`browser.getPage("name")`) **persist across script runs** — a flow is a
sequence of small scripts against one named page, no re-navigation.

`dev-browser --help` is the CLI reference. This file is the doctrine: **which capability
to reach for, when, and why**. Every snippet below was verified working on this machine.

---

## Rule zero — ONE browser, and it is the user's

The user works in one browser, pointed at one dev server they started. That browser is
THE browser. Do not multiply browsers. Do not multiply dev servers.

1. **Default mode is `--connect`** — attach to the user's running Chrome over CDP. You
   see the same tab, same session, same logins the user sees. Their console is your
   console.
2. **Before creating anything, look:** `dev-browser browsers` (managed instances) and
   `browser.listPages()` (tabs). If a page for this work exists, reuse it.
3. **Never launch a headed window ad hoc.** A visible new window means you chose the
   wrong mode.
4. **Never start your own dev server.** Check the user's first
   (`curl -s -o /dev/null -w '%{http_code}' http://localhost:<port>`). If it's up,
   drive it. If it's down, ask — the user owns server lifecycle.
5. **One named page per flow**, descriptive name (`"quote-flow"`, not `"page1"`).
   Anonymous `browser.newPage()` only for throwaway one-script checks.

### Mode selection

| Situation | Mode | Command shape |
|---|---|---|
| Debugging alongside the user; user says "in my browser", "the page I'm on" | **Attach** | `dev-browser --connect` (auto-discovers) |
| Autonomous verification sweep; user not driving; CI-ish flow run | **Daemon headless** | `dev-browser --headless --browser <project>` |
| Any reason to open a new visible window | **Doesn't exist** — ask the user | — |

`--connect` requires the user's Chrome to have remote debugging enabled. If
auto-discovery fails, give the user the exact relaunch command and stop — do **not**
silently fall back to a separate browser (separate browser = separate session/cookies,
and the user can't see what you did):

```bash
# macOS — quit Chrome fully first, then:
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --remote-debugging-port=9222
# Note: recent Chrome blocks the debug port on the default profile; if it doesn't take,
# add: --user-data-dir="$HOME/.chrome-debug-profile"   (or enable chrome://inspect/#remote-debugging)
```

In daemon mode, one named browser per project (`--browser arc`) so state accumulates in
one place instead of five.

---

## The observation model — read this before using console/network

Console and network are **event streams, not queryable history**. A listener captures
only what fires while it is attached, during that script's run. You cannot ask "what's
in the console" after the fact — you arrange to be listening when it happens.

**The canonical script shape — attach → act → settle → dump:**

```
attach listeners  →  perform ONE action  →  wait for quiet  →  print captured evidence
```

This mirrors human debugging ("open DevTools, click the button, read what happened") —
formalized. One action per script; end every script by logging the state the next
decision needs.

**Cross-script capture** on a named page: instrument the page itself so evidence
accumulates in a `window` buffer any later script can read:

```js
const page = await browser.getPage("quote-flow");
await page.addInitScript(() => {
  window.__agentLog = [];
  const orig = console.error;
  console.error = (...a) => { window.__agentLog.push(a.map(String).join(' ')); orig(...a); };
});
// survives navigations on this page; later script: await page.evaluate(() => window.__agentLog)
```

---

## Console — the page's own account of what went wrong

- **What:** every `console.log/warn/error`, uncaught exception, CORS/CSP violation, and
  failed-resource message — the DevTools Console, as data.
- **When to reach for it:**
  - After **any action that should mutate UI state** — a clean console is an acceptance
    criterion, not a nicety.
  - "The button does nothing" / "it doesn't work" with no visible error — the console
    almost always knows (uncaught rejection, hydration mismatch, CORS block).
  - After a dependency/config change — deprecation warnings and 404'd assets land here.
- **When NOT:** pure layout/visual questions (screenshot instead); server-side logic
  (read the server logs — the browser only sees the response).
- **Why:** without this you are blind to the failure class that produces *no* UI change.
  This is the difference between "seems to work" and "worked, verifiably."
- **How (verified):**

```js
const page = await browser.getPage("quote-flow");
const logs = [];
page.on('console', m => logs.push(m.type() + ': ' + m.text()));
page.on('pageerror', e => logs.push('pageerror: ' + e.message));

await page.getByRole('button', { name: 'Add item' }).click();   // the ONE action
await new Promise(r => setTimeout(r, 1500));                     // settle

console.log(JSON.stringify(logs, null, 2));
// Verdict: [] = clean. Anything of type error/pageerror = finding — report verbatim.
```

---

## Network — did the action actually talk to the server, and honestly?

- **What:** every request/response the page makes — method, URL, status, payload. The
  DevTools Network tab, as data.
- **When to reach for it:**
  - **Asserting the API side of a UI action** — clicking Save should fire exactly one
    `POST /api/quotes` returning `201`. Not zero, not two.
  - "Button does nothing" triage, step 1: **is the request even firing?** No request =
    frontend wiring bug; request + 4xx/5xx = backend or contract bug; request + 2xx +
    no UI change = frontend state bug. This one capture trisects the search space.
  - Suspected duplicate fires (double submits), payload-shape mismatches, slow endpoints.
  - Verifying a failure **surfaces honestly**: force an error, confirm the 500 arrives
    AND the UI tells the user (pair with a screenshot).
- **When NOT:** questions about server internals (that's server logs/tests); static
  pages with no API traffic.
- **Why:** the network capture is the contract between frontend and backend, observed
  live. It's the only evidence that distinguishes "UI lies" from "API fails."
- **How (verified):**

```js
const page = await browser.getPage("quote-flow");
const traffic = [];
page.on('request', r => traffic.push({ dir: '→', method: r.method(), url: r.url(), post: r.postData() }));
page.on('response', r => traffic.push({ dir: '←', status: r.status(), url: r.url() }));

await page.getByRole('button', { name: 'Save' }).click();
await new Promise(r => setTimeout(r, 2000));

console.log(JSON.stringify(traffic.filter(t => t.url.includes('/api/')), null, 2));
// Verdict: expected method+endpoint+status present, exactly once. Anything else = finding.
```

Need a response body? `page.on('response', async r => { if (r.url().includes('/api/')) bodies.push(await r.json().catch(() => null)); })`.

---

## Execute in page context — `page.evaluate`

- **What:** run arbitrary JS inside the page and get the result back — the DevTools
  console prompt, scripted.
- **When to reach for it:**
  - **Reading app state the DOM doesn't show** — store contents, `localStorage`,
    globals, computed styles, feature flags.
  - Probing a hypothesis mid-debug ("is the handler even bound?", "what does the client
    cache hold right now?").
  - Forcing edge states for verification — empty a list, expire a token — instead of
    hand-building data. (Say when you've mutated state; reload to reset.)
  - Reading the cross-script `window.__agentLog` buffer.
- **When NOT:** anything a locator/click/fill does natively — drive the UI like a user
  and keep the evidence honest; don't teleport past the interaction being tested.
- **Why:** it collapses "I wonder if…" from an edit-rebuild cycle to one line.
- **How (verified):** plain JS only inside evaluate — no TypeScript syntax.

```js
const page = await browser.getPage("quote-flow");
const state = await page.evaluate(() => ({
  itemCount: document.querySelectorAll('[data-line-item]').length,
  draft: JSON.parse(localStorage.getItem('quote-draft') || 'null'),
}));
console.log(JSON.stringify(state, null, 2));
```

---

## Flows — driving a feature end-to-end

A flow is an outcome statement made executable: *"clicking Add on a line item appends it
to the quote list."* Run it as small scripts on one named page, and judge **three lanes
of evidence** per step:

1. **UI lane** — the expected element appeared/changed (locator assertion or
   `snapshotForAI`; screenshot for visual judgment)
2. **Console lane** — clean (capture attached during the action)
3. **Network lane** — expected request(s), expected status, exactly once

A step passes only when all three agree. "The item appeared" with a console error and a
retried request is not a pass — it's two findings.

**Element discovery on unfamiliar pages:** `await page.snapshotForAI()` first, read the
roles/names, then interact via `page.getByRole(...)`. Known selectors: skip the snapshot.
After 2 failed locator attempts on one target, switch to `page.domCua` node ids; use
`page.cua` coordinates only when the visual structure is clearer than the DOM. After
acting, collect the **cheapest** sufficient check — not a snapshot AND a screenshot.

Screenshots: `await saveScreenshot(await page.screenshot(), "after-add.png")` → saved
under `~/.dev-browser/tmp/`, then Read the file to actually look at it.

---

## Decision table — symptom → instrument

| Task / symptom | Reach for | Because |
|---|---|---|
| "It doesn't work", nothing visible | Console capture | The no-UI failure class lives there |
| Button click → no effect | Network capture | Trisects: no request / bad response / frontend state |
| Verify a feature I just built | Full flow, three lanes | "Renders" is not "works" |
| Is the bug frontend or backend? | Network capture | Status + payload assigns blame |
| What's in the client state right now? | `page.evaluate` | DOM doesn't show stores |
| Does the empty/error state look right? | Force state via evaluate/route + screenshot | States must be seen to be judged |
| Where is the element to click? | `snapshotForAI` | Roles/names, cheap |
| User says "look at my browser" | `--connect` | Their tab IS the workspace |

---

## Teardown — you start it, you stop it

- Daemon-managed browsers you started: `dev-browser stop` when the work is done.
  Verify gone: `ps -Axo pid,args | grep -i dev-browser | grep -v grep`.
- **Never** kill the user's own Chrome or close tabs you didn't create in `--connect`
  mode. Close only your own named pages: `browser.closePage("name")`.
- Never leave a headless daemon running past session end unless the user asked.
