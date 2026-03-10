#!/bin/bash
# Detect when Claude writes duplicate DB query patterns that should use shared helpers
# Addresses the N+1 "latest score per tool" pattern found across multiple API routes
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.filePath // empty')
NEW_CONTENT=$(echo "$INPUT" | jq -r '.tool_input.new_string // .tool_input.content // empty')

# Only check API route files and lib files
if [[ ! "$FILE_PATH" =~ ^src/(app/api|lib)/ ]]; then
  exit 0
fi

# Check for the repeated "latest score" query pattern
if echo "$NEW_CONTENT" | grep -qE 'orderBy.*desc.*calculatedAt.*limit\(1\)'; then
  jq -n '{
    hookSpecificOutput: {
      hookEventName: "PostToolUse",
      additionalContext: "Warning: This looks like the repeated \"latest score per tool\" query pattern. Check if src/lib/queries.ts already has a shared helper for this, or consider creating one to avoid N+1 query duplication across API routes."
    }
  }'
  exit 0
fi

# Check for the repeated "latest github snapshot" pattern
if echo "$NEW_CONTENT" | grep -qE 'orderBy.*desc.*collectedAt.*limit\(1\)'; then
  jq -n '{
    hookSpecificOutput: {
      hookEventName: "PostToolUse",
      additionalContext: "Warning: This looks like a \"latest snapshot\" query. Check if a shared helper already exists in src/lib/queries.ts before duplicating this pattern."
    }
  }'
  exit 0
fi

exit 0
