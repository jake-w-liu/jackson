#!/bin/bash
# Commit the given paths and push to origin/main, serialized with a lock so
# several auditors can work on different chapters at the same time.
#   audit/commit.sh "message" sections/ch05.tex audit/ch05.md
set -u
repo=$(cd "$(dirname "$0")/.." && pwd)
cd "$repo" || exit 2
msg=$1; shift
exec 9>"$repo/.git/audit-commit.lock"
flock 9
git add -- "$@"
if git diff --cached --quiet -- "$@"; then
  echo "nothing to commit"
else
  git commit -q -m "$msg" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01QTwkJ6w6zjiAqGBoGjTc45" -- "$@" || exit 1
  echo "committed: $(git log -1 --format='%h %s')"
fi
for d in 0 2 4 8 16; do
  sleep $d
  if git push -q origin HEAD:main 2>/dev/null; then echo "pushed to origin/main"; exit 0; fi
done
echo "PUSH FAILED (commit kept locally; a later commit.sh run will push it)"
exit 0
