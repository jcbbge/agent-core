#!/usr/bin/env node

const { execSync } = require('child_process');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const AGENT_DIR = path.join(process.env.HOME, '.pi', 'agent');
const IDENTITY_FILE = path.join(AGENT_DIR, 'identity.json');
const AUDIT_LOG = path.join(AGENT_DIR, 'memory_audit.log');
const SURREAL_URL = 'http://127.0.0.1:6000/sql';
const MLX_URL = 'http://127.0.0.1:10240/v1/chat/completions';
const MODEL = 'mlx-community/Qwen3-8B-4bit';
const EMBED_MODEL = 'mlx-community/Qwen3-Embedding-4B-4bit-DWQ';

fs.mkdirSync(AGENT_DIR, { recursive: true });

if (!fs.existsSync(IDENTITY_FILE)) {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519');
    fs.writeFileSync(IDENTITY_FILE, JSON.stringify({
        publicKey: publicKey.export({ type: 'spki', format: 'pem' }),
        privateKey: privateKey.export({ type: 'pkcs8', format: 'pem' })
    }, null, 2), { mode: 0o600 });
}
const keys = JSON.parse(fs.readFileSync(IDENTITY_FILE));
const privateKey = crypto.createPrivateKey(keys.privateKey);
const publicKey = crypto.createPublicKey(keys.publicKey);

function sign(payload) {
    return crypto.sign(null, Buffer.from(JSON.stringify(payload)), privateKey).toString('base64');
}

function verify(payload, signatureStr) {
    if (!signatureStr || signatureStr === 'NONE' || signatureStr === 'null') return false;
    return crypto.verify(null, Buffer.from(JSON.stringify(payload)), publicKey, Buffer.from(signatureStr, 'base64'));
}

function appendAudit(action, type, signature, content) {
    const ts = new Date().toISOString();
    const entry = `[${ts}] [${action}] [${type}] [SIG:${signature ? signature.substring(0, 8) + '...' : 'N/A'}] ${content.substring(0, 100)}...\n`;
    fs.appendFileSync(AUDIT_LOG, entry);
    if (action !== 'DREAM_SILENT') console.log(entry.trim());
}

function surreal(query) {
    fs.writeFileSync('/tmp/surreal_payload.sql', `USE NS agent_os DB alembic; ${query}`);
    const curl = `curl -s -X POST -u "root:surreal" -H "Accept: application/json" -H "NS: agent_os" -H "DB: alembic" --data-binary "@/tmp/surreal_payload.sql" ${SURREAL_URL}`;
    try {
        const out = execSync(curl, { encoding: 'utf-8' });
        const data = JSON.parse(out);
        for (let i = data.length - 1; i >= 0; i--) {
            if (data[i].status === 'ERR') {
                console.error("SurrealDB Error:", data[i].result);
            }
            if (Array.isArray(data[i].result) && data[i].result.length > 0) return data[i].result;
            if (data[i].status === 'OK' && typeof data[i].result === 'object') return [data[i].result];
        }
        return [];
    } catch (e) { return []; }
}

function getEmbedding(text) {
    if (!text) return null;
    const payload = JSON.stringify({ model: EMBED_MODEL, input: text });
    const curl = `curl -s -X POST ${MLX_URL.replace('/chat/completions', '/embeddings')} -H "Content-Type: application/json" -d '${payload.replace(/'/g, "'\\''")}'`;
    try {
        const out = execSync(curl, { encoding: 'utf-8' });
        return JSON.parse(out).data[0].embedding;
    } catch(e) { return null; }
}

function cosineSim(A, B) {
    let dot = 0, normA = 0, normB = 0;
    for(let i=0; i<A.length; i++) { dot += A[i]*B[i]; normA += A[i]*A[i]; normB += B[i]*B[i]; }
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function getCentroid(vectors) {
    const centroid = new Array(vectors[0].length).fill(0);
    for (let v of vectors) { for (let i=0; i<v.length; i++) centroid[i] += v[i]; }
    return centroid.map(x => x / vectors.length);
}

const cmd = process.argv[2];

if (cmd === 'write') {
    const type = process.argv[3];
    const content = process.argv[4];
    const sig = sign({ type, content });
    surreal(`CREATE shard CONTENT { type: '${type}', content: ${JSON.stringify(content)}, role: 'assistant', tags: [], episodeId: episode:default, metadata: { signature: '${sig}' }, temporal: { created_at: time::now() } };`);
    appendAudit('WRITE', type, sig, content);
} 
else if (cmd === 'search') {
    const q = process.argv[3];
    const records = surreal(`SELECT id, type, content, metadata.signature as signature FROM shard WHERE content CONTAINS '${q}' LIMIT 20;`);
    const verified = records.filter(r => verify({ type: r.type, content: r.content }, r.signature));
    appendAudit('SEARCH', 'query', null, `Hits: ${records.length}, Verified: ${verified.length}`);
    console.log(JSON.stringify(verified, null, 2));
}
else if (cmd === 'refract') {
    const shards = [
        ...surreal("SELECT id, content FROM shard WHERE type = 'insight' ORDER BY id DESC LIMIT 10;"),
        ...surreal("SELECT id, content FROM shard WHERE type = 'decision' ORDER BY id DESC LIMIT 10;"),
        ...surreal("SELECT id, content FROM shard WHERE type = 'dialogue' ORDER BY id DESC LIMIT 10;"),
        ...surreal("SELECT id, content FROM shard WHERE type IN ['insight', 'decision', 'dialogue'] ORDER BY id ASC LIMIT 50;") // Ancestor pool
    ];
    if (shards.length === 0) {
        console.log("No shards to refract.");
        process.exit(0);
    }
    
    // Pick 3 random shards for the collision (Serendipity enforcement)
    // Lens: Luck (Ancestor Injection) - Force at least 1 old shard
    const selection = [];
    const recent = shards.slice(0, 30);
    const ancestors = shards.slice(30);
    
    selection.push(ancestors[Math.floor(Math.random() * ancestors.length)] || recent[0]);
    selection.push(recent[Math.floor(Math.random() * recent.length)]);
    selection.push(recent[Math.floor(Math.random() * recent.length)]);
    
    const inputEmbeddings = selection.map(s => getEmbedding(s.content)).filter(e => e !== null);
    
    // 1. Math: Serendipity (Vector distance between inputs)
    let serendipity = 0;
    if (inputEmbeddings.length > 1) {
        let totalDist = 0; let pairs = 0;
        for(let i=0; i<inputEmbeddings.length; i++) {
            for(let j=i+1; j<inputEmbeddings.length; j++) {
                totalDist += (1 - cosineSim(inputEmbeddings[i], inputEmbeddings[j]));
                pairs++;
            }
        }
        serendipity = Math.min(1.0, (totalDist / pairs) * 2.5);
    }
    
    const prompt = `Synthesize a structural insight from the following waking memories. 
Respond in pure JSON format ONLY:
{
  "insight": "ONE short, actionable structural insight.",
  "domain_tag": "dev|philosophy|architecture|workflow",
  "self_critique": "Briefly explain why this insight matters now based on the memories."
}

Waking Memories:
` + selection.map(s => `- ${s.content}`).join('\n');
    
    try {
        const payload = JSON.stringify({
            model: MODEL,
            messages: [
                { role: "system", content: "You are the subconscious pattern layer. Output strictly valid JSON." },
                { role: "user", content: prompt }
            ],
            temperature: 0.9,
            max_tokens: 500
        });
        
        const outLLM = execSync(`curl -s -X POST ${MLX_URL} -H "Content-Type: application/json" -d '${payload.replace(/'/g, "'\\''")}'`, { encoding: 'utf-8' });
        
        let rawResponse = JSON.parse(outLLM).choices[0].message.content.trim();
        
        if (rawResponse.includes("</think>")) rawResponse = rawResponse.split("</think>")[1].trim();
        if (rawResponse.startsWith("\`\`\`json")) rawResponse = rawResponse.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();
        if (rawResponse.startsWith("\`\`\`")) rawResponse = rawResponse.replace(/\`\`\`/g, '').trim();
        
        const parsed = JSON.parse(rawResponse);
        const synthesis = parsed.insight;
        const critique = parsed.self_critique || "";
        const domainTag = parsed.domain_tag || "general";
        
        // 2. Math: Criticality (Vector distance from input centroid)
        let criticality = 0;
        const synthEmb = getEmbedding(synthesis);
        if (synthEmb && inputEmbeddings.length > 0) {
            const centroid = getCentroid(inputEmbeddings);
            const dist = 1 - cosineSim(synthEmb, centroid);
            criticality = Math.min(1.0, dist * 3.0);
        }
        
        // Present Collision is measured continuously on Wake.
        const pc = 0.0; 
        
        const critFixed = parseFloat(criticality.toFixed(2));
        const serFixed = parseFloat(serendipity.toFixed(2));
        const pcFixed = parseFloat(present_collision.toFixed(2));
        
        // Lens: Criticality (Auto-Tuning Edge)
        // Hardcoded 0.3 fallback, but ideally pulls ground state from recent shards
        const composite = (critFixed + serFixed) / 2;
        if (composite < 0.3) {
            console.log(`Refraction aborted. Composite math score ${composite.toFixed(2)} too low.`);
            process.exit(0);
        }

        const sig = sign({ type: 'refraction', content: synthesis, criticality: critFixed, serendipity: serFixed, present_collision: pcFixed });
        // Lens: Debug-Hypothesis (TTL Falsification)
        // Set an expiration date 7 days from now. Downstream usage will remove the expiration.
        const dbPayload = `CREATE shard CONTENT { 
            type: 'refraction', 
            content: ${JSON.stringify(synthesis)}, 
            role: 'subconscious', 
            tags: ['refraction', '${domainTag}'], 
            episodeId: episode:default, 
            metadata: { 
                signature: '${sig}',
                criticality: ${critFixed},
                serendipity: ${serFixed},
                present_collision: ${pcFixed},
                self_critique: ${JSON.stringify(critique)}
            }, 
            temporal: { created_at: time::now(), expires_at: time::now() + 7d } 
        };`;
        
        surreal(dbPayload);
        appendAudit('REFRACT', 'refraction', sig, `[Crit:${critFixed} Ser:${serFixed} Tag:${domainTag}] ${synthesis}`);
        console.log("Refraction signed and persisted with deterministic vector scoring.");
    } catch(e) { console.error("Refraction failed:", e); process.exit(1); }
}
else if (cmd === 'wake') {
    // Lens: iCloud-Tabs-Distiller (Context-Aware Hydration)
    // Grab the current directory to pull domain-relevant refractions
    const currentDir = path.basename(process.cwd());
    const records = surreal("SELECT id, type, content, tags, metadata FROM shard WHERE type = 'refraction' ORDER BY id DESC LIMIT 50;");
    
    let verified = records.filter(r => r.metadata && r.metadata.signature && verify({ 
        type: r.type, 
        content: r.content, 
        criticality: r.metadata.criticality, 
        serendipity: r.metadata.serendipity, 
        present_collision: r.metadata.present_collision 
    }, r.metadata.signature));

    // Lens: Atelier (Data-Ink TUI)
    // Strip the framing, show the sparkline
    if (verified.length > 0) {
        const v = verified[0]; // Pull most recent
        const c = Math.round(v.metadata.criticality * 100);
        const s = Math.round(v.metadata.serendipity * 100);
        const domain = (v.tags && v.tags.length > 1) ? v.tags[1] : 'general';
        
        console.log(`\x1b[36m[ ${c}% C | ${s}% S | ${domain} ]\x1b[0m ${v.content}`);
    }
} else {
    console.log("Commands: write <type> <content> | search <query> | refract | wake");
}
