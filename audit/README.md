# Audit

Problem-by-problem audit of `sections/ch01.tex` … `sections/ch16.tex`.
Each chapter has a log `audit/chNN.md`; its first line gives the chapter's
status and each later line records one audited problem.

## Outcome

All 16 chapters (394 problems) have had both passes. The logs record 64
fixes: wrong or overstated claims, rounding slips, unexplained or
unjustified erratum marks, a units slip (3.21), a mistyped fraction
(15.1), and figures that were physically wrong or clipped (2.20, 5.15,
8.16) or had labels overprinted by lines. No boxed result needed a change
of physics. Three notes remain open because they could not be settled
without the printed book or depend on a modelling choice: 9.13 (moving
magnetization model), 12.19 (overall sign of Jackson's (12.117)) and
14.27(c) (a relative O(K²) factor D = 1 + K²/2). `main.pdf` was rebuilt
from the audited sources.

## Resuming

The audit is designed to survive interruptions. Progress is committed and
pushed to `main` every few problems, so to resume:

1. `git pull origin main`.
2. For every `audit/chNN.md` whose status is not `complete`, start an auditor
   on that chapter with the protocol below. It skips the problems already
   listed in the log and continues with the next one.
3. For every chapter whose status is `complete` but not
   `complete (second pass complete)`, run the second pass (below).
4. When all chapters are complete, run `audit/check.sh` for the whole
   document and rebuild `main.pdf` locally (the figure sources under
   `supplementary/` are not in the repository).

## Second pass

After a chapter's first pass, an independent second pass re-audits it in
groups of up to four problems, and also reviews the first pass's own fixes.
Every proposed fix goes to three independent verifiers (fresh derivation,
numerical check, consistency with the book and the rest of the solution).
A fix is applied only when at least two of the three confirm both the defect
and the replacement. Results are logged under `## Second pass` in
`audit/chNN.md`, with a `- Second pass X–Y — done` marker per group, and
committed group by group.

The pass is the Workflow script `audit/second-pass.js`, run once per chapter
with the arguments printed by `audit/second-pass-args NN`. That command
leaves out groups whose marker is already logged, so rerunning it after an
interruption picks up where the pass stopped.

## Protocol for auditing chapter NN

Work only on `sections/chNN.tex` and `audit/chNN.md`.

1. Read `audit/chNN.md`. Problems already listed there are done; start with
   the first problem not listed. Read the whole chapter file once for
   context (notation, cross-references between problems).
2. For each remaining problem, in order, check:
   - **Statement.** The text should match Jackson, 3rd ed. Text in
     `\erratum{...}` (dark red) marks a published erratum or a correction or
     qualification established in the solution: check that each such mark is
     justified and that the solution actually explains it.
   - **Physics and mathematics.** Re-derive the key steps and every boxed or
     final result: signs, factors of 2, π, ε₀/μ₀ (SI in Chs. 1–10, Gaussian
     in Chs. 11–16 unless the problem says otherwise), boundary conditions,
     limits and special cases, dimensions. Recompute numerical values (Python
     with sympy/numpy/scipy, scripts kept outside the repository).
   - **Completeness.** Every part of the problem is answered.
   - **Claims.** Statements presented as facts are correct and not overstated.
   - **LaTeX.** No broken markup, mismatched delimiters or garbled text.
3. Fix only real defects, with minimal, surgical edits in the file's existing
   style (`\solution`, `\boxed`, `\erratum`, display math). Do not restyle or
   rewrite correct material. Be sure before changing anything: confirm a
   suspected error by an independent derivation or a numerical check, since a
   wrong "fix" is worse than none. If a point is debatable, leave the text
   and record a `NOTE`.
4. After each problem append one line to `audit/chNN.md`:
   - `- N.M — OK`
   - `- N.M — FIXED: <what was wrong and what changed>`
   - `- N.M — NOTE: <possible issue left unchanged, and why>`
5. Every 2–3 problems, and after every problem with a fix, run
   `audit/check.sh chNN` (must say `COMPILE OK`) and then
   `audit/commit.sh "Audit ch NN: problems N.a–N.b" sections/chNN.tex audit/chNN.md`.
   Use no other git commands.
6. When the last problem is done, change the status line to
   `Status: complete`, run `audit/check.sh chNN`, and commit as above.

## Tools

- `audit/check.sh [chNN]` — compile the whole document or one chapter in a
  temporary directory, with stub boxes for missing figure sources.
- `audit/commit.sh "message" paths...` — commit the given paths and push to
  `origin/main` (serialized with a lock so chapters can be audited in
  parallel).
- `audit/second-pass-args NN` and `audit/second-pass.js` — arguments and
  script for the second pass.
