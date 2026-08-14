#!/usr/bin/env bun
import { inboxState } from '/Users/jrg/agent-core/primitives/mcps/tower/lib.mjs'

const SERVER = '/Users/jrg/agent-core/primitives/mcps/tower/server.mjs'
const CWD = '/Users/jrg/agent-core'

async function withMcp(fn) {
  const proc = Bun.spawn(['bun', SERVER], { cwd: CWD, stdin: 'pipe', stdout: 'pipe', stderr: 'pipe' })
  let buf = ''
  const decoder = new TextDecoder()
  let nextId = 1
  const reader = proc.stdout.getReader()
  const readResponse = async () => {
    while (!buf.includes('\n')) {
      const { done, value } = await reader.read()
      if (done) throw new Error('closed: ' + (await new Response(proc.stderr).text()))
      buf += decoder.decode(value)
    }
    const nl = buf.indexOf('\n')
    const line = buf.slice(0, nl)
    buf = buf.slice(nl + 1)
    return JSON.parse(line)
  }
  const rpc = async (method, params = {}) => {
    const id = nextId++
    proc.stdin.write(JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n')
    const msg = await readResponse()
    if (msg.error) throw new Error(JSON.stringify(msg.error))
    return msg.result
  }
  const callTool = async (name, args) => {
    const r = await rpc('tools/call', { name, arguments: args })
    const text = r?.content?.map((c) => c.text).join('') ?? JSON.stringify(r)
    if (r?.isError) {
      const err = new Error(text)
      err.isToolError = true
      throw err
    }
    return text
  }
  try {
    await rpc('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'orch-live', version: '1' },
    })
    // notification — no response
    proc.stdin.write(JSON.stringify({ jsonrpc: '2.0', method: 'notifications/initialized' }) + '\n')
    return await fn({ callTool })
  } finally {
    try {
      proc.kill()
    } catch {}
  }
}

const out = await withMcp(async ({ callTool }) => {
  const delText = await callTool('send_to_user', {
    kind: 'deliverable',
    title: 'w3-plane-fixes F1 live probe',
    from: 'ORCH w3-plane-fixes',
    message: 'LIVE-PROBE F1 deliverable must enter unrelayed with to:operator',
  })
  await callTool('send_to_user', {
    kind: 'progress',
    from: 'ORCH w3-plane-fixes',
    message: 'LIVE-PROBE F1 progress must NOT enter unrelayed',
  })
  const state = inboxState(CWD)
  const probe = state.unrelayed.find((m) =>
    String(m.message || '').includes('LIVE-PROBE F1 deliverable'),
  )
  const progIn = state.unrelayed.find((m) =>
    String(m.message || '').includes('LIVE-PROBE F1 progress'),
  )
  let refuseText = null
  let refuseThrew = false
  try {
    refuseText = await callTool('mark_relayed', { ids: ['t-not-a-real-unrelayed-id'] })
  } catch (e) {
    refuseThrew = true
    refuseText = String(e.message || e)
  }
  let ackText = null
  if (probe?.id) {
    ackText = await callTool('mark_relayed', { ids: [probe.id] })
  }
  const leftovers = inboxState(CWD).unrelayed.filter(
    (m) =>
      String(m.from || '').includes('AGNT f1-f4') ||
      String(m.title || '').includes('plane-f1'),
  )
  const cleanup = []
  if (leftovers.length) {
    try {
      cleanup.push(await callTool('mark_relayed', { ids: leftovers.map((m) => m.id) }))
    } catch (e) {
      cleanup.push('cleanup_failed:' + e.message)
    }
  }
  return {
    delText,
    probeId: probe?.id ?? null,
    probeTo: probe?.to ?? null,
    progressInUnrelayed: !!progIn,
    refuseThrew,
    refuseText,
    ackText,
    probeStillUnrelayed: inboxState(CWD).unrelayed.some((m) => m.id === probe?.id),
    cleanup,
    unrelayedCount: inboxState(CWD).unrelayed.length,
  }
})

console.log(JSON.stringify(out, null, 2))
