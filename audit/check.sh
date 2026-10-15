#!/bin/bash
# Compile-check the LaTeX sources in a throwaway directory.
#   audit/check.sh          -> whole document (main.tex)
#   audit/check.sh ch05     -> only sections/ch05.tex, wrapped in main.tex's preamble
# Figure sources under supplementary/ are not published; any that are missing
# are replaced by stub boxes so the text itself can still be checked.
set -u
repo=$(cd "$(dirname "$0")/.." && pwd)
tmp=$(mktemp -d)
cp -r "$repo/main.tex" "$repo/sections" "$tmp/"
[ -d "$repo/supplementary" ] && cp -r "$repo/supplementary" "$tmp/"
cd "$tmp" || exit 2
grep -ohE '\\input\{supplementary/[^}]*\}' sections/*.tex | sed -E 's/\\input\{(.*)\}/\1/' | sort -u |
while read -r f; do
  [ -f "$f" ] || { mkdir -p "$(dirname "$f")"; echo '\fbox{\small figure source not in repository}' > "$f"; }
done
if [ $# -ge 1 ]; then
  sed '/\\begin{document}/,$d' main.tex > doc.tex
  printf '\\begin{document}\n\\section{Chapter}\n\\input{sections/%s.tex}\n\\end{document}\n' "$1" >> doc.tex
else
  cp main.tex doc.tex
fi
pdflatex -interaction=nonstopmode -halt-on-error doc.tex > /dev/null 2>&1
rc=$?
if [ $rc -ne 0 ]; then
  echo "COMPILE FAILED (log: $tmp/doc.log)"
  grep -E '^!' -A6 doc.log | head -40
  exit 1
fi
echo "COMPILE OK ($(grep -c 'Overfull \\hbox' doc.log) overfull hboxes; log: $tmp/doc.log)"
grep -E 'LaTeX Warning|Package .* Warning' doc.log | grep -v 'Rerun' | sort | uniq -c | head -20
exit 0
