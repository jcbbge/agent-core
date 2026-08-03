import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { spawnSync } from "child_process";
import { Type } from "@sinclair/typebox";

/**
 * composto — Code-to-IR compression extension for pi.
 *
 * Shells out to /opt/homebrew/bin/composto and returns the output.
 *
 * Supported subcommands:
 *   ir <file> [L0|L1|L2|L3]
 *   context <path> --budget <N>
 *   scan <path>
 *   benchmark <path>
 *   trends <path>
 *
 * Languages: TypeScript, JavaScript, Python, Go, Rust.
 * Does NOT support Swift or Zig — read those files directly.
 */

const COMPOSTO_BIN = "/opt/homebrew/bin/composto";

export default function (pi: ExtensionAPI) {
  pi.registerTool({
    name: "composto",
    label: "Composto IR",
    description: [
      "Compress source files to a token-efficient IR for LLM consumption (89% fewer tokens).",
      "Supported languages: TypeScript, JavaScript, Python, Go, Rust.",
      "Does NOT support Swift or Zig.",
      "",
      "Pass the full composto subcommand + args as `command`.",
      "Examples:",
      "  ir apps/api/src/routes/quotes.ts L0",
      "  ir packages/db/src/schema.ts L1",
      "  context apps/api/src/ --budget 4000",
      "  scan packages/db/src/",
      "  benchmark apps/web/src/",
      "",
      "Do NOT use for files you intend to edit or when you need exact string literals/comments.",
      "Use L3 or the Read tool for those cases.",
    ].join("\n"),
    parameters: Type.Object({
      command: Type.String({
        description:
          "Full composto subcommand and arguments, e.g. 'ir src/index.ts L1' or 'context src/ --budget 4000'",
      }),
    }),
    execute: async ({ command }, _ctx) => {
      const parts = command.trim().split(/\s+/);
      const result = spawnSync(COMPOSTO_BIN, parts, {
        encoding: "utf8",
        timeout: 30_000,
      });

      if (result.error) {
        return `composto error: ${result.error.message}`;
      }

      const out = result.stdout?.trim() ?? "";
      const err = result.stderr?.trim() ?? "";

      if (result.status !== 0) {
        return `composto exited ${result.status}${err ? `\n${err}` : ""}`;
      }

      return out || err || "(no output)";
    },
  });
}
