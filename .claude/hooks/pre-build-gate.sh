#!/bin/bash
# Pre-build gate — enforces team process before any src/ file is edited
#
# Behaviour:
#   - Ignores edits outside src/ (bug fixes, docs, specs are fine)
#   - If .claude/current-feature exists, checks that spec files are in place
#   - If spec files are missing, blocks with a clear message
#   - If no current-feature declared, warns but allows (covers hotfix context)

INPUT=$(cat)

FILE_PATH=$(echo "$INPUT" | python3 -c "
import json, sys
d = json.load(sys.stdin)
inp = d.get('tool_input', {})
print(inp.get('file_path', inp.get('path', '')))
" 2>/dev/null)

# Only gate changes inside src/
if [[ "$FILE_PATH" != *"/src/"* ]]; then
  exit 0
fi

PROJECT_ROOT="/Users/phillm/Dev/Animalkingdom"
CURRENT_FEATURE_FILE="$PROJECT_ROOT/.claude/current-feature"

# No feature declared — warn but allow (hotfix / polish context)
if [ ! -f "$CURRENT_FEATURE_FILE" ]; then
  echo "⚠️  PRE-BUILD REMINDER: No current feature declared in .claude/current-feature"
  echo ""
  echo "If you are starting a new feature, STOP and run the team phases first:"
  echo "  Phase A → User Researcher + UX Designer"
  echo "  Phase B → Product Owner (then get [OWNER] approval)"
  echo "  Phase C → Developer + Frontend Engineer"
  echo ""
  echo "If this is a bug fix or polish change, continue — this warning is informational."
  exit 0
fi

FEATURE=$(cat "$CURRENT_FEATURE_FILE" | tr -d '[:space:]')

INTERACTION_SPEC="$PROJECT_ROOT/spec/features/$FEATURE/interaction-spec.md"
REFINED_STORIES="$PROJECT_ROOT/product/$FEATURE/refined-stories.md"

MISSING=0

if [ ! -f "$INTERACTION_SPEC" ]; then
  echo "⛔ PRE-BUILD GATE — BLOCKED"
  echo ""
  echo "Feature '$FEATURE' is declared but interaction-spec.md is missing."
  echo "Expected: spec/features/$FEATURE/interaction-spec.md"
  echo ""
  echo "Run Phase A (UR) and Phase B (UX) before writing any code."
  MISSING=1
fi

if [ ! -f "$REFINED_STORIES" ]; then
  echo "⛔ PRE-BUILD GATE — BLOCKED"
  echo ""
  echo "Feature '$FEATURE' is declared but refined-stories.md is missing."
  echo "Expected: product/$FEATURE/refined-stories.md"
  echo ""
  echo "Run Phase B (PO) and get [OWNER] approval before writing any code."
  MISSING=1
fi

if [ $MISSING -eq 1 ]; then
  exit 1
fi

exit 0
