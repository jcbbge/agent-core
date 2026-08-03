/*---
name: tldraw
description: Drive the open tldraw offline canvas app — read shapes, run editor code (create/move/style/connect), capture screenshots, and install durable document scripts (clickable UI, animation loops). The master interface for building diagrams and interactive explainers on the live canvas. Use when a task touches tldraw, a .tldraw/.tldr file, or "draw/diagram/visualize on the whiteboard".
tags: [tldraw, canvas, diagram, visualize, whiteboard, drawing, animation, interactive]
version: 1.0.0
params: |
  {
    "type": "object",
    "properties": {
      "op": {
        "type": "string",
        "enum": ["docs", "read", "bindings", "exec", "screenshot", "script-workspace", "script-status", "recipe", "api", "imports", "readme"],
        "description": "Operation. docs=list open docs; read=shapes of a doc; bindings=arrow bindings; exec=run editor JS; screenshot=capture JPEG path; script-workspace=get durable script paths; script-status=watcher state; recipe=read a worked recipe by id; api=search Editor API members; imports=list importable tldraw symbols; readme=full API reference."
      },
      "doc": { "type": "string", "description": "Target doc id. Omit to use the most-recently-focused doc. Accepts a name substring too (resolved via docs)." },
      "code": { "type": "string", "description": "JavaScript for op=exec (runs against live `editor`, `helpers`; import SDK via `await import('tldraw')`). For op=read/bindings/docs the connector supplies its own code." },
      "id": { "type": "string", "description": "Recipe id for op=recipe (e.g. 'animation-simulation-loop', 'clickable-card-or-button-ui')." },
      "query": { "type": "string", "description": "Search term for op=api (filters Editor member names)." },
      "size": { "type": "string", "enum": ["small", "medium", "large", "full"], "description": "Screenshot size (op=screenshot). Default 'large'." },
      "mode": { "type": "string", "enum": ["canvas", "window"], "description": "Screenshot mode (op=screenshot). 'canvas'=shapes only; 'window'=full app UI." }
    },
    "required": ["op"]
  }
---*/

/**
 * tldraw — utensil wrapper for the tldraw offline desktop canvas API.
 *
 * The app runs a local HTTP server whose port + per-launch bearer token live in
 * server.json. This utensil re-reads both on every call (the token is per-launch,
 * fixed for the app's lifetime, cheap to re-read), resolves the target doc, and
 * exposes the three API surfaces (search / exec / script-workspace) behind one op.
 *
 * See the `tldraw` skill and ~/tldraw-mastery/PLAYBOOK.md for craft conventions.
 */

import { execSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const SERVER_JSON = join(
	homedir(),
	"Library",
	"Application Support",
	"tldraw",
	"server.json",
);

interface TldrawInputs {
	op:
		| "docs"
		| "read"
		| "bindings"
		| "exec"
		| "screenshot"
		| "script-workspace"
		| "script-status"
		| "recipe"
		| "api"
		| "imports"
		| "readme";
	doc?: string;
	code?: string;
	id?: string;
	query?: string;
	size?: "small" | "medium" | "large" | "full";
	mode?: "canvas" | "window";
}

interface ServerInfo {
	port: number;
	token: string;
	pid: number;
	startedAt: number;
}

function readServer(): ServerInfo {
	if (!existsSync(SERVER_JSON)) {
		throw new Error(
			"tldraw offline is not running (no server.json). Open the app and a canvas first.",
		);
	}
	const raw = JSON.parse(readFileSync(SERVER_JSON, "utf8"));
	if (!raw.port || !raw.token) {
		throw new Error("server.json present but missing port/token — app may be starting.");
	}
	return raw as ServerInfo;
}

/** Low-level HTTP via curl (keeps zero external deps; matches the shell examples). */
function curl(
	method: "GET" | "POST",
	path: string,
	token: string,
	port: number,
	body?: string,
): any {
	const args = [
		"-s",
		"-X",
		method,
		`http://localhost:${port}${path}`,
		"-H",
		`authorization: Bearer ${token}`,
	];
	if (body !== undefined) {
		args.push("-H", "content-type: application/json", "--data-binary", "@-");
	}
	const cmd = `curl ${args.map(shellEscape).join(" ")}`;
	const out = execSync(cmd, {
		encoding: "utf8",
		input: body,
		maxBuffer: 32 * 1024 * 1024,
		timeout: 60_000,
	});
	if (path === "/readme") return out; // plain text
	try {
		return JSON.parse(out);
	} catch {
		return out;
	}
}

/** POST JS code to a /search or /exec-style endpoint. */
function postCode(path: string, code: string, token: string, port: number): any {
	return curl("POST", path, token, port, JSON.stringify({ code }));
}

/** Resolve a doc id from an explicit id, a name substring, or the focused doc. */
function resolveDoc(input: string | undefined, token: string, port: number): string {
	if (input && input.startsWith("tldr:")) return input;
	const res = postCode("/api/search", "return await api.getDocs()", token, port);
	const docs: any[] = res?.result ?? [];
	if (docs.length === 0) throw new Error("No open tldraw documents.");
	if (input) {
		const hit = docs.find((d) =>
			(d.name ?? "").toLowerCase().includes(input.toLowerCase()),
		);
		if (hit) return hit.id;
		throw new Error(`No open doc matching "${input}". Open docs: ${docs.map((d) => d.name).join(", ")}`);
	}
	return docs[0].id; // most-recently-focused
}

export default async function tldraw(inputs: TldrawInputs): Promise<any> {
	const { op } = inputs;
	const { port, token } = readServer();

	switch (op) {
		case "readme":
			return { op, readme: curl("GET", "/readme", token, port) };

		case "docs":
			return postCode("/api/search", "return await api.getDocs()", token, port);

		case "imports":
			return postCode("/api/search", "return api.imports", token, port);

		case "api": {
			const q = (inputs.query ?? "").toLowerCase();
			const code = q
				? `return api.members.filter(m => m.name.toLowerCase().includes(${JSON.stringify(q)})).map(m => ({ name: m.name, signature: m.signature, description: m.description, category: m.category }))`
				: "return api.categories";
			return postCode("/api/search", code, token, port);
		}

		case "recipe": {
			if (!inputs.id) {
				return postCode(
					"/api/search",
					"return Object.values(api.recipes).map(r => ({ id: r.id, title: r.title, whenToUse: r.whenToUse }))",
					token,
					port,
				);
			}
			return postCode("/api/search", `return api.recipes[${JSON.stringify(inputs.id)}]`, token, port);
		}

		case "read": {
			const docId = resolveDoc(inputs.doc, token, port);
			return postCode(
				"/api/search",
				`const s = await api.getShapes(${JSON.stringify(docId)}); return { doc: ${JSON.stringify(docId)}, page: s.page, viewport: s.viewport, shapes: s.shapes.map(x => ({ id: x.id, type: x.type, x: x.x, y: x.y, props: x.props, meta: x.meta })) }`,
				token,
				port,
			);
		}

		case "bindings": {
			const docId = resolveDoc(inputs.doc, token, port);
			return postCode("/api/search", `return await api.getBindings(${JSON.stringify(docId)})`, token, port);
		}

		case "screenshot": {
			const docId = resolveDoc(inputs.doc, token, port);
			const opts = { size: inputs.size ?? "large", ...(inputs.mode ? { mode: inputs.mode } : {}) };
			return postCode(
				"/api/search",
				`return await api.getScreenshot(${JSON.stringify(docId)}, ${JSON.stringify(opts)})`,
				token,
				port,
			);
		}

		case "exec": {
			if (!inputs.code) throw new Error("op=exec requires `code`.");
			const docId = resolveDoc(inputs.doc, token, port);
			return postCode(`/api/doc/${docId}/exec`, inputs.code, token, port);
		}

		case "script-workspace": {
			const docId = resolveDoc(inputs.doc, token, port);
			return curl("POST", `/api/doc/${docId}/script-workspace`, token, port, "");
		}

		case "script-status": {
			const docId = resolveDoc(inputs.doc, token, port);
			return curl("GET", `/api/doc/${docId}/script-status`, token, port);
		}

		default:
			throw new Error(`Unknown tldraw op: ${op}`);
	}
}

function shellEscape(s: string): string {
	if (/^[a-zA-Z0-9_./:@-]+$/.test(s)) return s;
	return `'${s.replace(/'/g, "'\\''")}'`;
}
