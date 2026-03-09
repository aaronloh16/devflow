#!/bin/bash
# Run TypeScript type-check after file edits to catch errors early
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Only check .ts/.tsx files
if [[ ! "$FILE_PATH" =~ \.(ts|tsx)$ ]]; then
  exit 0
fi

OUTPUT=$(npx tsc --noEmit 2>&1)
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
  # Filter to just the errors (not the "Found N errors" summary noise)
  ERRORS=$(echo "$OUTPUT" | grep -E "^src/|error TS" | head -20)
  jq -n --arg errors "$ERRORS" '{
    hookSpecificOutput: {
      hookEventName: "PostToolUse",
      additionalContext: ("TypeScript errors detected after edit:\n" + $errors + "\nFix these before continuing.")
    }
  }'
else
  exit 0
fi
