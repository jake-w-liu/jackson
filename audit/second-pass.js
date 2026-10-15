export const meta = {
  name: 'jackson-second-pass',
  description: 'Independent second audit pass of one chapter of the Jackson solutions, with 3-lens adversarial verification of every proposed fix',
  phases: [
    { title: 'Find', detail: 'independent re-audit of each problem group (and review of first-pass fixes)' },
    { title: 'Verify', detail: '3 independent verifiers per finding (derivation / numerical / context)' },
    { title: 'Apply', detail: 'apply confirmed fixes serially, log, compile-check, commit and push' },
    { title: 'Finish', detail: 'mark the chapter second pass complete' },
  ],
}

const REPO = '/home/user/jackson'
const SCRATCH = '/tmp/claude-0/-home-user-jackson/d17e1758-c8da-5e30-bcd4-0d24d3cbba45/scratchpad/second-pass'
const { ch, n, items } = args
const FILE = `sections/ch${ch}.tex`
const LOG = `audit/ch${ch}.md`
const UNITS = Number(n) <= 10 ? 'SI units (Chapters 1–10)' : 'Gaussian units (Chapters 11–16)'

const FINDINGS = {
  type: 'object',
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          problem: { type: 'string', description: 'problem number, e.g. 5.12' },
          summary: { type: 'string', description: 'one sentence: what is wrong and what the correct statement is' },
          old_str: { type: 'string', description: 'exact current text from the file, occurring exactly once' },
          new_str: { type: 'string', description: 'replacement text in the file\'s LaTeX style' },
          evidence: { type: 'string', description: 'the independent derivation and/or computation that proves the defect' },
        },
        required: ['problem', 'summary', 'old_str', 'new_str', 'evidence'],
      },
    },
    checked: { type: 'string', description: 'one line per problem in scope: what was verified' },
  },
  required: ['findings', 'checked'],
}

const VERDICT = {
  type: 'object',
  properties: {
    defect_real: { type: 'boolean' },
    fix_correct: { type: 'boolean' },
    better_new_str: { type: 'string', description: 'corrected replacement for the same old_str if the defect is real but the proposed fix is flawed; empty otherwise' },
    reasoning: { type: 'string' },
  },
  required: ['defect_real', 'fix_correct', 'reasoning'],
}

const COMMON = `Context: ${REPO} holds worked solutions to Jackson, Classical Electrodynamics (3rd ed.). Chapter ${n} is in ${REPO}/${FILE} and uses ${UNITS} unless a problem says otherwise. Each problem starts with a line like "\\noindent\\textbf{${n}.1}\\quad <statement>", followed by "\\solution" and the worked solution. Text in \\erratum{...} (dark red) marks a published Jackson erratum or a correction/qualification of the problem statement that the solution establishes; every such mark must be justified and explained in the solution. Python 3 with sympy, numpy, scipy and mpmath is available; keep any scripts under ${SCRATCH}/ch${ch}/ (create it), never in the repository. Do not edit any repository file and do not run any git command that changes state.`

function findPrompt(item) {
  if (item.kind === 'firstpass') {
    return `${COMMON}

Task: review the changes a first-pass audit made to ${FILE}. Run \`git -C ${REPO} diff e48b013 -- ${FILE}\` (read-only) and read the FIXED entries in ${REPO}/${LOG}. For every hunk, decide independently whether the original text really was wrong and whether the new text is correct, complete, minimal, consistent with the rest of that solution (later steps, boxed results, other problems that cite it) and valid LaTeX. Re-derive or recompute as needed.

Report a finding only for a change that is wrong, incomplete or that introduced an inconsistency: old_str = text as it now stands in the file (occurring exactly once; check with Python str.count), new_str = the corrected text (which may restore the original). Changes that are correct produce no finding. In "checked", list each hunk with your verdict.`
  }
  return `${COMMON}

Task: independent second-pass audit of problems ${item.problems} (lines ${item.start}–${item.end} of ${FILE}; read the rest of the chapter where a solution refers to other problems or equations). A first-pass audit already ran (log: ${REPO}/${LOG}), but do not rely on it — check everything yourself, carefully and to the end of the last problem in scope.

For each problem in scope:
1. Statement: compare with Jackson 3rd ed. as you know it (wording, given data, equation references). Check each \\erratum mark is justified and explained.
2. Physics and mathematics: re-derive the key steps and every boxed or final result yourself — signs, factors of 2 and π, ε₀/μ₀ or c placement for the unit system, boundary conditions, limiting and special cases, dimensions. Recompute every numerical value in Python.
3. Completeness: every part (a), (b), … is answered, including requested plots/discussions.
4. Claims: statements presented as facts are correct and not overstated.
5. LaTeX: no broken markup or garbled text.

Report only genuine defects that you have confirmed by your own derivation or computation: wrong results, sign/factor/unit errors, wrong numbers, false or misleading claims, missing parts, unjustified erratum marks, broken LaTeX. Equivalent alternative forms, style preferences, extra rigor you would have liked, and debatable judgement calls are NOT defects. For each defect give a minimal fix: old_str copied exactly from the current file and occurring exactly once (check with Python str.count), and new_str in the file's style (if the error propagates to later lines, either choose an old_str covering them or report each occurrence as its own finding). Return an empty findings list if everything checks out.`
}

const LENSES = [
  { key: 'derivation', text: 'Re-derive the relevant result yourself from first principles, without trusting either the current text or the proposed replacement, and compare.' },
  { key: 'numerical', text: 'Test the current text and the proposed replacement numerically or symbolically in Python: direct evaluation, limiting and special cases, dimensional analysis, numerical integration — whatever discriminates between them.' },
  { key: 'context', text: 'Check against Jackson 3rd ed. (problem statement, conventions, units, equation numbering, known errata) and against the rest of the solution: is the replacement consistent with surrounding text, later steps and boxed results; is the change minimal; is it valid LaTeX; does old_str occur exactly once in the file? Treat stylistic or debatable changes as not defects.' },
]

function verifyPrompt(item, f, lens) {
  return `${COMMON}

An auditor claims a defect in problem ${f.problem} (${item.kind === 'firstpass' ? 'a change made by the first-pass audit' : 'second-pass audit'}):

Summary: ${f.summary}

Current text (old_str):
<<<
${f.old_str}
>>>

Proposed replacement (new_str):
<<<
${f.new_str}
>>>

Auditor's evidence: ${f.evidence}

Your lens: ${lens.text}

Be a skeptic and try to refute the claim; read the problem and its full solution in the file. Decide independently:
- defect_real: the current text is actually wrong (not merely a different but equivalent form, a style choice, or a debatable judgement). If you cannot confirm the error with your own derivation or computation, answer false.
- fix_correct: the proposed replacement is correct, minimal, consistent with the rest of the solution, and valid LaTeX.
If the defect is real but the fix is flawed, put a corrected replacement for the same old_str in better_new_str.`
}

function fmtFinding(v, i) {
  const f = v.f
  const remarks = v.votes.map(x => `  - [${x.lens}] defect_real=${x.defect_real}, fix_correct=${x.fix_correct}: ${x.reasoning}${x.better_new_str ? `\n    suggested replacement:\n<<<\n${x.better_new_str}\n>>>` : ''}`).join('\n')
  return `### Finding ${i + 1} — problem ${f.problem}
Summary: ${f.summary}
old_str:
<<<
${f.old_str}
>>>
new_str:
<<<
${f.new_str}
>>>
Auditor's evidence: ${f.evidence}
Verifier remarks:
${remarks}`
}

function marker(item) {
  return item.kind === 'firstpass' ? '- Second pass review of first-pass fixes — done' : `- Second pass ${item.problems} — done`
}

function applyPrompt(item, confirmed, disputed) {
  const heading = '## Second pass (independent re-audit; each fix confirmed by at least 2 of 3 verifiers)'
  const logStep = `Append to ${REPO}/${LOG}: if the file has no line starting with "## Second pass", first append a blank line and the heading line "${heading}" followed by a blank line. Then append one line per finding handled (\`- N.M — FIXED (second pass): <what was wrong and what changed>\` or \`- N.M — NOTE (second pass): <issue and why it was left unchanged>\`), and finally the marker line \`${marker(item)}\`.`
  const commitStep = `Run \`${REPO}/audit/check.sh ch${ch}\` (it must print COMPILE OK; if not, fix the LaTeX you introduced), then \`${REPO}/audit/commit.sh "Audit ch ${n} (second pass): ${item.kind === 'firstpass' ? 'review of first-pass fixes' : 'problems ' + item.problems}" ${FILE} ${LOG}\`. Use no other git commands and touch no other files.`
  if (!confirmed.length && !disputed.length) {
    return `In the repository ${REPO}, record that the second audit pass of chapter ${n} (${item.problems}) found no confirmed defects.

1. ${logStep} (No finding lines — only the heading if missing, and the marker.)
2. ${commitStep}`
  }
  return `${COMMON.replace('Do not edit any repository file and do not run any git command that changes state.', '')}

Task: apply verified second-pass fixes to ${FILE} (${item.problems}) and record them. You may edit ${FILE} and ${LOG} only.

CONFIRMED findings (defect and fix each confirmed by at least 2 of 3 independent verifiers):
${confirmed.length ? confirmed.map(fmtFinding).join('\n\n') : '(none)'}

DISPUTED findings (defect confirmed by at least 2 verifiers, but the proposed fix was not):
${disputed.length ? disputed.map(fmtFinding).join('\n\n') : '(none)'}

Steps:
1. For each CONFIRMED finding, apply the replacement with the Edit tool (old_str must match exactly once; if verifiers proposed a refinement that is better supported, use it). Then read the rest of that problem's solution, and any later problem that cites it, for text that depends on the changed result, and update it consistently with minimal edits.
2. For each DISPUTED finding, re-derive the point yourself using the verifier remarks. Apply a fix only if you are confident of the correct text; otherwise leave the file unchanged and record a NOTE.
3. ${logStep}
4. ${commitStep}

Reply with one line per finding: applied / noted, plus the commit hash.`
}

let chain = Promise.resolve()
const results = await pipeline(
  items,
  item => agent(findPrompt(item), {
    label: `find:${item.problems}`, phase: 'Find', schema: FINDINGS,
  }),
  (found, item) => parallel((found?.findings || []).map(f => () =>
    parallel(LENSES.map(lens => () =>
      agent(verifyPrompt(item, f, lens), {
        label: `verify:${f.problem}:${lens.key}`, phase: 'Verify', schema: VERDICT,
      }).then(v => v && { ...v, lens: lens.key })
    )).then(vs => ({ f, votes: vs.filter(Boolean) }))
  )),
  (verified, item) => {
    const list = (verified || []).filter(Boolean)
    const confirmed = list.filter(v => v.votes.filter(x => x.defect_real && x.fix_correct).length >= 2)
    const disputed = list.filter(v => !confirmed.includes(v) && v.votes.filter(x => x.defect_real).length >= 2)
    const rejected = list.length - confirmed.length - disputed.length
    log(`ch${ch} ${item.problems}: ${list.length} finding(s): ${confirmed.length} confirmed, ${disputed.length} disputed, ${rejected} refuted`)
    const p = chain.then(() => agent(applyPrompt(item, confirmed, disputed), {
      label: `apply:${item.problems}`, phase: 'Apply',
      ...(confirmed.length || disputed.length ? {} : { effort: 'low' }),
    }))
    chain = p.catch(() => null)
    return p.then(out => ({
      item: item.problems,
      findings: list.map(v => ({ problem: v.f.problem, summary: v.f.summary, confirms: v.votes.filter(x => x.defect_real && x.fix_correct).length, defectVotes: v.votes.filter(x => x.defect_real).length })),
      confirmed: confirmed.length, disputed: disputed.length, rejected, apply: out,
    }))
  },
)
await chain

phase('Finish')
const finish = await agent(`In the repository ${REPO}: every group of chapter ${n} should now have a "- Second pass ... — done" marker in ${LOG}. Run \`${REPO}/audit/second-pass-args ${ch}\`; if its "items" list is empty, change the first line of ${LOG} to exactly \`Status: complete (second pass complete)\`, run \`${REPO}/audit/check.sh ch${ch}\` (must print COMPILE OK) and \`${REPO}/audit/commit.sh "Audit ch ${n}: second pass complete" ${FILE} ${LOG}\`. If items remain, change nothing and report which. Use no other git commands. Reply with the outcome in one line.`, { label: 'finish', phase: 'Finish', effort: 'low' })

return { ch, results, finish }
