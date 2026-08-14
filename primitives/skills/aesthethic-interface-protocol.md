---
id: aesthetic-interface-protocol
name: Aesthetic Interface Protocol (AIP)
version: 1.0.0
description: Logic for transforming verbose system names and CRUD methods into high-density ASCII/Hex-style shorthand.
tags: [cli, logging, aesthetic, developer-experience]
---

# Aesthetic Interface Protocol (AIP)

## Overview
AIP replaces standard verbose logging (e.g., "DeluxeServer.read()") with a compressed, system-level nomenclature designed for minimal visual noise and maximum "nerdy" readability.

## 1. Identity Hash Logic (The "0x" Prefix)
To transform a system, tool, or server name:
1.  **Strip Vowels**: Remove all vowels (a, e, i, o, u) from the name.
2.  **Capitalize**: Convert the remaining consonants to uppercase.
3.  **Hex Prefix**: Prepend `0x` to the result.

**Standard Formula:** `Name` → `[Vowel-less Consonants].toUpperCase()` → `0x[RESULT]`

## 2. Operation Glyph Mapping (The CRUD Characters)
Map standard method intents to their corresponding ASCII characters. These glyphs represent the "physics" of the action.

| Intent | Glyph | Representation |
| :--- | :---: | :--- |
| **Create / Insert** | `+` | Adding a record/state. |
| **Read / Query** | `?` | Requesting information. |
| **Update / Patch** | `~` | Mutating existing state. |
| **Delete / Purge** | `!` | Destructive or final action. |
| **Execute / Run** | `>` | Directional flow/trigger. |
| **Sync / Connect** | `::` | Bi-directional state/link. |

## 3. Formatting Convention
The final output must follow the bracketed-operation pattern for scannability:
`0xID [GLYPH] MESSAGE`

## 4. Examples
| Original Call | AIP Output |
| :--- | :--- |
| `Deluxe.read("user_123")` | `0xDLX [?] user_123` |
| `Bento.update(config)` | `0xBNT [~] config_updated` |
| `Anima.delete(session)` | `0xNM [!] session_purged` |
| `Stripe.sync()` | `0xSTRP [::] connection_active` |

## 5. Implementation Notes
- **Fallback**: If a method does not fit the standard CRUD categories, use `*` (the "splat") as a general-purpose action indicator.
- **Coloration (Optional)**: In TTY environments, the `0xID` should remain default/white, while the `[GLYPH]` should be color-coded by intent (Green for `+`, Blue for `?`, Yellow for `~`, Red for `!`).
