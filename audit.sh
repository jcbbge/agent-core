#!/usr/bin/env bash
# primitives-audit.sh — profile-driven audit of all 9 primitives × all harnesses
# Truth comes from harnesses/*.json. Add a new harness? Add a profile. Done.

set -uo pipefail

RED='\033[0;31m'; YLW='\033[0;33m'; GRN='\033[0;32m'; DIM='\033[2m'; RST='\033[0m'; BLD='\033[1m'

HARNESS_DIR="$HOME/Documents/_agents/harnesses"
SOURCE="$HOME/Documents/_agents/schema"

PRIMITIVES=(agent_file rules skills commands custom_tools hooks mcp_servers subagents plugins)
LABELS=("AGENTS.md" "Rules" "Skills" "Commands" "Custom Tools" "Hooks" "MCP Servers" "Subagents" "Plugins")

# Source counts for reference
src_count() {
  local type="$1"
  case "$type" in
    rules)     ls "$SOURCE/rules/"*.md 2>/dev/null | wc -l | tr -d ' ' ;;
    skills)    ls "$SOURCE/skills/" 2>/dev/null | wc -l | tr -d ' ' ;;
    commands)  ls "$SOURCE/commands/" 2>/dev/null | wc -l | tr -d ' ' ;;
    subagents) ls "$SOURCE/subagents/" 2>/dev/null | wc -l | tr -d ' ' ;;
    mcp_servers) python3 -c "import json; d=json.load(open('$SOURCE/mcp/registry.json')); print(len(d.get('servers',[])))" 2>/dev/null || echo "?" ;;
    *) echo "" ;;
  esac
}

check_primitive() {
  local harness_file="$1"
  local primitive="$2"

  local supported=$(python3 -c "
import json, sys
d = json.load(open('$harness_file'))
p = d['primitives'].get('$primitive', {})
print(str(p.get('supported', False)).lower())
" 2>/dev/null)

  local verify=$(python3 -c "
import json, sys
d = json.load(open('$harness_file'))
p = d['primitives'].get('$primitive', {})
print(p.get('verify','true'))
" 2>/dev/null)

  # Not supported by this harness
  if [[ "$supported" == "false" || "$supported" == "none" || -z "$supported" ]]; then
    printf "${DIM}—${RST}"
    return
  fi

  # Run the verify command
  local expanded_verify="${verify/\~/$HOME}"
  if eval "$expanded_verify" 2>/dev/null; then
    # Verify passed — check counts for countable types
    local deploy_path=$(python3 -c "
import json, sys
d = json.load(open('$harness_file'))
p = d['primitives'].get('$primitive', {})
print(p.get('deploy_path', ''))
" 2>/dev/null)
    local count=""
    case "$primitive" in
      rules|skills|commands|subagents)
        local tgt_expanded="${deploy_path/\~/$HOME}"
        count=$(ls "$tgt_expanded" 2>/dev/null | wc -l | tr -d ' ')
        local src=$(src_count "$primitive")
        if [[ -n "$src" && "$count" != "$src" ]]; then
          printf "${YLW}⚠ $count/$src${RST}"
          return
        fi
        printf "${GRN}✓ $count${RST}"
        ;;
      mcp_servers)
        # Check against registry
        local reg_names=$(python3 -c "
import json
d=json.load(open('$SOURCE/mcp/registry.json'))
print(' '.join(s['name'] for s in d.get('servers',[])))
" 2>/dev/null)
        local harness_name=$(python3 -c "import json; print(json.load(open('$harness_file'))['harness'])" 2>/dev/null)
        local installed_names=""
        case "$harness_name" in
          claude-code)
            installed_names=$(python3 -c "import json,os; d=json.load(open(os.path.expanduser('~/.claude.json'))); print(' '.join(d.get('mcpServers',{}).keys()))" 2>/dev/null || echo "") ;;
          opencode)
            installed_names=$(python3 -c "import json,os; d=json.load(open(os.path.expanduser('~/.config/opencode/opencode.json'))); print(' '.join(d.get('mcp',{}).keys()))" 2>/dev/null || echo "") ;;
          omp)
            installed_names=$(python3 -c "import json,os; d=json.load(open(os.path.expanduser('~/.omp/agent/mcp.json'))); print(' '.join(d.get('mcpServers',{}).keys()))" 2>/dev/null || echo "") ;;
        esac
        local missing=""
        for n in $reg_names; do
          echo "$installed_names" | grep -qw "$n" || missing="$missing $n"
        done
        local inst_count=$(echo "$installed_names" | wc -w | tr -d ' ')
        local total=$(src_count mcp_servers)
        if [[ -z "$missing" ]]; then
          printf "${GRN}✓ $inst_count/$total${RST}"
        else
          printf "${YLW}⚠ $inst_count/$total miss:$(echo $missing | tr ' ' ',')${RST}"
        fi
        ;;
      *)
        printf "${GRN}✓${RST}"
        ;;
    esac
  else
    printf "${RED}✗${RST}"
  fi
}

# ── Header ─────────────────────────────────────────────────────────────────
echo ""
echo -e "${BLD}PRIMITIVES AUDIT  $(date '+%Y-%m-%d %H:%M')${RST}"
echo -e "${DIM}Source: $SOURCE${RST}"

# Load harness list — skip UNVERIFIED profiles
HARNESS_FILES=()
HARNESS_NAMES=()
UNVERIFIED=()
for f in "$HARNESS_DIR"/*/profile.json; do
  status=$(python3 -c "import json; print(json.load(open('$f')).get('status',''))" 2>/dev/null)
  n=$(python3 -c "import json; print(json.load(open('$f'))['harness'])" 2>/dev/null)
  if [[ "$status" == UNVERIFIED* ]]; then
    UNVERIFIED+=("$n")
  else
    HARNESS_FILES+=("$f")
    HARNESS_NAMES+=("$n")
  fi
done

if [[ ${#UNVERIFIED[@]} -gt 0 ]]; then
  echo -e "${YLW}⚠ Skipping unverified harnesses: ${UNVERIFIED[*]}${RST}"
  echo -e "${DIM}  Run harness onboarding SOP before these can be audited.${RST}"
  echo ""
fi

# Print header row
printf "\n${BLD}%-4s %-16s" "#" "PRIMITIVE"
for name in "${HARNESS_NAMES[@]}"; do
  printf "  %-18s" "$name"
done
printf "${RST}\n"
printf '%.0s─' {1..80}; echo ""

# Print each primitive row
for i in "${!PRIMITIVES[@]}"; do
  prim="${PRIMITIVES[$i]}"
  label="${LABELS[$i]}"
  printf "%-4s %-16s" "$((i+1))" "$label"

  for hf in "${HARNESS_FILES[@]}"; do
    printf "  "
    result=$(check_primitive "$hf" "$prim")
    # Pad to 18 chars (ignoring ANSI)
    clean=$(echo -e "$result" | sed 's/\x1b\[[0-9;]*m//g')
    pad=$((18 - ${#clean}))
    printf "%s%*s" "$result" "$pad" ""
  done
  echo ""
done

printf '%.0s═' {1..80}; echo ""

# ── Critical gaps ───────────────────────────────────────────────────────────
echo ""
echo -e "${BLD}GAPS:${RST}"
GAPS=0

for hf in "${HARNESS_FILES[@]}"; do
  hname=$(python3 -c "import json; print(json.load(open('$hf'))['harness'])" 2>/dev/null)
  for prim in "${PRIMITIVES[@]}"; do
    supported=$(python3 -c "
import json
d=json.load(open('$hf'))
print(str(d['primitives'].get('$prim',{}).get('supported',False)).lower())
" 2>/dev/null)
    verify=$(python3 -c "
import json
d=json.load(open('$hf'))
print(d['primitives'].get('$prim',{}).get('verify','true'))
" 2>/dev/null)

    [[ "$supported" == "false" || "$supported" == "none" || -z "$supported" ]] && continue

    if ! eval "$verify" 2>/dev/null; then
      note=$(python3 -c "
import json
d=json.load(open('$hf'))
print(d['primitives'].get('$prim',{}).get('note',''))
" 2>/dev/null)
      paths=$(python3 -c "import json; d=json.load(open('$hf')); p=d['primitives'].get('$prim',{}); print(', '.join(p.get('search_paths',[])) or p.get('target',''))" 2>/dev/null)
      echo -e "  ${RED}✗ $hname → $prim${RST}  ${DIM}$paths${RST}"
      [[ -n "$note" ]] && echo -e "    ${DIM}$note${RST}"
      GAPS=$((GAPS+1))
    fi
  done
done

[[ "$GAPS" -eq 0 ]] && echo -e "  ${GRN}None — all configured primitives verified.${RST}"

echo ""
echo -e "${DIM}Harness profiles: $HARNESS_DIR/${RST}"
echo -e "${DIM}Add a harness: drop a new .json profile in that directory.${RST}"
