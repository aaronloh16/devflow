#!/bin/bash
# Auto-format files after Claude writes/edits them
INPUT=$(cat)
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty')

# Only format JS/TS/JSON/CSS files
if [[ ! "$FILE_PATH" =~ \.(ts|tsx|js|jsx|json|css)$ ]]; then
  exit 0
fi

# Skip node_modules and build output
if [[ "$FILE_PATH" =~ (node_modules|\.next|dist)/ ]]; then
  exit 0
fi

npx prettier --write "$FILE_PATH" 2>/dev/null
exit 0
