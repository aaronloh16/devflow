#!/bin/bash
# Block dangerous shell commands that could cause data loss or affect shared state
INPUT=$(cat)
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')

if [ -z "$COMMAND" ]; then
  exit 0
fi

# Split on && and ; to check each subcommand independently
# This avoids false positives from text inside commit messages, heredocs, etc.
while IFS= read -r subcmd; do
  # Trim leading whitespace
  subcmd=$(echo "$subcmd" | sed 's/^\s*//')

  # Block: rm -rf, rm -f, rm --recursive, etc.
  if echo "$subcmd" | grep -qE '^rm\s+(-[a-zA-Z]*[rf]|--force|--recursive)\b'; then
    echo "Blocked: recursive/forced delete. Remove files individually or ask the user first." >&2
    exit 2
  fi

  # Block: git push --force (but not --force-with-lease)
  if echo "$subcmd" | grep -qE '^git\s+push\s+.*--force\b' && ! echo "$subcmd" | grep -qE '--force-with-lease'; then
    echo "Blocked: git push --force can destroy remote history. Use --force-with-lease or ask the user." >&2
    exit 2
  fi

  # Block: git reset --hard, git clean -f
  if echo "$subcmd" | grep -qE '^git\s+(reset\s+--hard|clean\s+-f)'; then
    echo "Blocked: destructive git operation. This can lose uncommitted work." >&2
    exit 2
  fi

  # Block: SQL destructive commands (only when subcmd starts with a SQL client or pipe)
  if echo "$subcmd" | grep -qiE '^(psql|mysql|sqlite3|neonctl)\b.*\b(DROP\s+(TABLE|DATABASE|SCHEMA)|TRUNCATE\s+TABLE)'; then
    echo "Blocked: destructive database operation. Ask the user first." >&2
    exit 2
  fi
done <<< "$(echo "$COMMAND" | sed 's/&&/\n/g; s/;/\n/g')"

exit 0
