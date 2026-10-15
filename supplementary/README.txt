Reproducible calculations for the Jackson worked solutions

The worked derivations are in sections/ch01.tex through sections/ch16.tex.
main.tex assembles the problem statements, solutions and TikZ figures into
main.pdf. Each new problem starts after a paragraph break and blank vertical
space; a keep-with-next reservation prevents a lone problem number at the
foot of a page. Dark red marks corrected statements and qualifications,
with the reason given in the corresponding solution.

Run the commands below from the project root. Python needs numpy, scipy
and sympy. The checked environment uses Python 3 with numpy 2.4.6,
scipy 1.18.0 and sympy 1.14.0. Use ordinary Python, without -O: the
calculation scripts use assertions for their verification gates.

To run all sixteen mathematical check scripts, regenerate their figures,
and check structural coverage:

python3 - <<'PY'
import subprocess
import sys

extra = {
    2: ['--write-assets', '--images', 'supplementary/ch02_images.csv'],
    4: ['--figures'],
    7: ['--write-assets'],
    10: ['--figures'],
    13: ['--figures'],
}
for chapter in range(1, 17):
    subprocess.run([
        sys.executable, '-W', 'error',
        f'supplementary/check_ch{chapter:02d}.py',
        *extra.get(chapter, []),
    ], check=True)
subprocess.run([
    sys.executable, 'supplementary/audit_solutions.py',
], check=True)
PY

For an individual chapter, run its check_chNN.py file. Chapters 2, 4, 7,
10 and 13 require the options above to regenerate their optional assets;
the other scripts regenerate any figures they own by default. These
scripts use symbolic identities, independent integrals, boundary and
conservation checks, direct numerical solves, or convergence comparisons
as appropriate. Their output identifies the checks actually performed.
They supplement the written derivations; finite numerical samples alone
do not prove a general identity. Proof-only arguments, such as the
uniqueness proof in 2.28, are reviewed in the text.

Figures and numerical output are in supplementary/figures, chapter-named
TeX files, CSV files and chNN-results.json files. Source records and any
retained experimental data are in the chapter source folders. Historical
comparisons identify the actual source used: 10.17 uses Jackson's
reproduction and independently converged exact scattering sums; 11.8
uses accessible primary experimental reports while noting the unavailable
1964 full text; 14.25 does not claim a numerical comparison with the
unavailable Joos curves. These access limits are stated in the solutions.

To rebuild the complete PDF, use a TeX installation with the packages
listed in main.tex (including TikZ, needspace, microtype and hyperref):

    latexmk -pdf -interaction=nonstopmode -halt-on-error main.tex

latexmk repeats the compilation until the contents and links are current.
The verified final build ran this command on a byte-identical local
temporary copy of main.tex, sections and the supplementary TeX/data
inputs. An in-place build in this workspace did not stabilize its
auxiliary files; build/workspace-build-attempt.log records that attempt.
If this recurs, copy those inputs to a local temporary directory, build
there and copy the resulting main.pdf back. The cause of the in-place
auxiliary-file changes has not been established.

With Poppler installed, rendered pages for a visual layout check can be
made with:

    mkdir -p build/main-review
    pdftoppm -r 90 -png main.pdf build/main-review/page

The final verification record is supplementary/verification.json, with
source and artifact hashes, all sixteen observed check exits, build
evidence and visual-review coverage. The final calculation logs are
build/deep-debug-final-check-chNN.log. The structural report is
supplementary/coverage.json. audit_solutions.py checks all
374 problem numbers, one nonempty solution body per problem, local figure
inputs, and the spacing before every problem. Its status is 0 for a
complete valid structure, 1 for empty solution bodies, and 2 for invalid
structure, spacing or missing input files. It does not certify algebraic
correctness or subpart completeness. Mathematical checks, source review
and visual inspection are separate parts of verification.

The latest independent audit is recorded in deep-debug-ch01.json through
deep-debug-ch16.json and summarized in deep-debug-audit.json. Every problem
has a fresh derivation review and a final review using a different route,
such as a boundary condition, conservation law, direct integral or limiting
case. These records distinguish confirmed corrections from discarded
candidates and preserve unsuccessful check attempts and their resolutions.
The earlier recheck-chNN.json files retain the preceding pedagogical review,
including the intermediate derivation steps added there. Both reviews check
notation against Jackson's actual definitions, including chapter-specific
units, Fourier normalizations and tensor conventions. Problem-specific
conventions and historical source-access limits remain explicit.

The latest full-build evidence is build/deep-debug-build-result.json;
build/deep-debug-findings.json lists the five corrected issues. The retained
root-level independent probes can be reproduced with:

    python3 -W error build/deep-debug-ch01-independent.py
    python3 -W error build/deep-debug-root-independent.py

The final audit also uses the additional independent checks now included in
the sixteen chapter scripts. Its tests, source comparisons and numerical
samples do not constitute a claim of mathematical infallibility.

The pre-existing verify.py, verify2.py, verify3.py and verify4.py at the
project root compare problem transcription with OCR. They are not
mathematical solution verifiers. Files under build are compilation,
source-inspection and visual-review intermediates.
