// Mimics tower-ledger.mjs append() BEFORE the 2026-08-13 flock patch: no lock at all.
const [,, path, id, from, topic, body] = process.argv
const fs = await import('node:fs')
const obj = { id, ts: new Date().toISOString(), cwd: process.cwd(), type: 'finding', from, topic, body }
const line = JSON.stringify(obj) + '\n'   // compact — no spaces after ':' or ','
fs.appendFileSync(path, line)             // no flock, no lockfile
