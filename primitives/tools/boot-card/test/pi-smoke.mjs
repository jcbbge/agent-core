// pi-smoke — handler smoke for the pi boundary adapter's [boot] stamp,
// mirroring the fake-ctx pattern the session-boundary acceptance used: load
// the extension, hand it a stub pi object, fire before_agent_start once,
// and assert the injected message ends with the stamp. Exit 0 iff present.

const hook = new URL('../../../hooks/session-boundary-pi.ts', import.meta.url).pathname
const mod = await import(hook)

const handlers = {}
mod.default({ on: (ev, fn) => { handlers[ev] = fn } })
if (typeof handlers['before_agent_start'] !== 'function') {
  console.error('pi adapter never registered before_agent_start')
  process.exit(1)
}

const res = await handlers['before_agent_start']({}, { cwd: process.cwd() })
const content = res?.message?.content ?? ''
const last = content.split('\n').at(-1) ?? ''
if (!/^\[boot\] handoff [✓✗].* · flight [✓✗].* · tower: tower-auto( extension)? · memory: circadian-mind( extension)?$/.test(last)) {
  console.error('stamp missing or malformed; injected content was:\n' + (content || '(nothing)'))
  process.exit(1)
}
console.log(last)
