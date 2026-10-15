#!/bin/bash
# Commit the given paths and push to origin/main, serialized with a lock so
# several auditors can work on different chapters at the same time.
#   audit/commit.sh "message" sections/ch05.tex audit/ch05.md
# If the push is rejected because origin/main moved on, origin/main is merged
# in (only when that merges cleanly) and the push is retried.
set -u
repo=$(cd "$(dirname "$0")/.." && pwd)
cd "$repo" || exit 2
msg=$1; shift
trailer="Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01QTwkJ6w6zjiAqGBoGjTc45"
exec 9>"$repo/.git/audit-commit.lock"
flock 9
git add -- "$@"
if git diff --cached --quiet -- "$@"; then
  echo "nothing to commit"
else
  git commit -q -m "$msg" -m "$trailer" -- "$@" || exit 1
  echo "committed: $(git log -1 --format='%h %s')"
fi
for d in 0 2 4 8; do
  sleep $d
  if git push -q origin HEAD:main 2>/dev/null; then echo "pushed to origin/main"; exit 0; fi
  if git fetch -q origin main 2>/dev/null && ! git merge-base --is-ancestor origin/main HEAD; then
    if git merge -q --no-edit -m "Merge origin/main into audit work" -m "$trailer" origin/main >/dev/null 2>&1; then
      echo "merged origin/main"
    else
      git merge --abort 2>/dev/null
      echo "PUSH FAILED: origin/main does not merge cleanly (commit kept locally)"
      exit 0
    fi
  fi
done
echo "PUSH FAILED (commit kept locally; a later commit.sh run will push it)"
exit 0
