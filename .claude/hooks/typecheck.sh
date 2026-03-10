#!/bin/bash
# Run TypeScript type-check when Claude finishes responding (Stop hook)
# Uses tsc --noEmit instead of next build to avoid network dependencies (e.g. Google Fonts)
INPUT=$(cat)

# Skip if node_modules not installed
if [ ! -d "$CLAUDE_PROJECT_DIR/node_modules" ]; then
  exit 0
fi

OUTPUT=$(cd "$CLAUDE_PROJECT_DIR" && npx tsc --noEmit --pretty false 2>&1)
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
  # Filter to src/ errors only (ignore config files and scripts that use Node globals)
  ERRORS=$(echo "$OUTPUT" | grep -E "^src/" | head -20)
  if [ -n "$ERRORS" ]; then
    jq -n --arg errors "$ERRORS" '{
      decision: "block",
      reason: ("TypeScript errors in src/:\n" + $errors + "\nFix these before continuing.")
    }'
  else
    # No src/ errors — other errors are likely config/env issues, don't block
    exit 0
  fi
else
  exit 0
fi
