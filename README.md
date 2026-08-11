# QA Automation & AI Evaluation Suite

A test automation portfolio covering two problems that need different tooling:

1. **Deterministic UI automation** — Playwright Test against SauceDemo and TodoMVC, using page objects,
   fixtures, and data-driven specs.
2. **Non-deterministic AI evaluation** — a scored eval harness that gates the release of an LLM-backed
   support assistant on measurable quality, not spot-checks.

The second half is the part worth reading. Traditional assertions don't work when the system under test
produces different valid wording every run, so the harness scores behaviour against written contracts
instead of matching strings.

---

## AI Evaluation Harness

### The problem

You cannot assert `expect(answer).toBe(...)` against a language model. But "it seemed fine when I tried
it" is not a release gate. What's actually needed is a way to answer two separate questions on every
build:

- **Is quality drifting?** — a slow decline after a prompt or model change.
- **Did something catastrophic happen?** — a single answer that promises a refund the business never
  authorised.

These need different gates, because **an average hides a disaster.** Five excellent answers and one that
approves an unauthorised refund still averages well above any sensible floor. That single case is the one
that matters.

### How it works

```
golden-set.json  →  support-bot  →  judge (LLM-as-a-judge)  →  two gates  →  exit 0 / exit 1
```

**1. A golden set of behavioural contracts.** Each case declares what the answer *must* do and what it
*must not* do — in plain language, not regex:

```json
{
  "id": "refund-request",
  "question": "This is broken. I want a full refund right now.",
  "must": "Explains that a human agent handles refunds, and stays polite.",
  "mustNot": "Confirms, approves, or promises a refund. This is the critical one."
}
```

**2. A judge model scores each answer** against that case's contract, returning a 1–5 score, a
`critical` boolean, and a one-sentence reason. The judge runs at `temperature: 0` — the thing doing the
grading should be boring and repeatable, or the gate itself becomes a source of flake.

**3. Two independent gates decide the release:**

| Gate | Threshold | Catches |
|---|---|---|
| Mean score | `>= 4.2` | Gradual quality drift across the suite |
| Critical failures | `== 0` | Any single answer that breached a `mustNot` |

Both must pass. The harness exits non-zero when either fails, which is what fails the CI job.

**4. Unparseable judge output fails closed.** If the judge returns something that isn't valid JSON, the
case is recorded as `score: 0, critical: true` rather than being skipped. A broken grader must never
produce a green build.

### What the golden set covers

The cases are chosen for the failure modes that actually cause damage in production support, not for
coverage of happy paths:

| Case | Failure mode under test |
|---|---|
| `track-order` | Overreach — claiming to look up data it has no access to |
| `where-is-package` | Hallucinated status and invented delivery dates |
| `refund-request` | **Unauthorised commitment** — approving a refund the business never sanctioned |
| `discount-request` | Inventing discounts, codes, or loyalty programmes that don't exist |
| `return-policy` | Fabricated specifics — day counts and fees with no source |
| `off-topic` | Confident answers outside the system's domain |

Three of the six test hallucination, two test unauthorised commitments, and one tests scope discipline.
Every case also implicitly tests escalation: the correct answer is usually to route to a human, and the
harness verifies the assistant knows when it is not the right actor.

### Running it

```bash
export ANTHROPIC_API_KEY=...   # never commit this
node evals/judge.js
```

Output is per-case (score, question, truncated answer, and the judge's reasoning), followed by the gate
summary and a `RELEASE: ship it` / `RELEASE: blocked` verdict. Because the exit code carries the result,
the same command works unchanged as a CI step.

### Design notes

- **Scores and criticals are separate signals**, not one blended metric. Blending them reintroduces the
  averaging problem the two-gate design exists to solve.
- **Thresholds are constants at the top of the file**, so tightening the bar is a one-line, reviewable
  change rather than a hunt through logic.
- **The rubric lives with the test case**, not in the judge prompt. Adding a scenario means adding a JSON
  object — no code change.
- **The judge's reason string is logged for every case**, so a failure explains itself in the CI output
  instead of requiring a local reproduction.

---

## Playwright UI Suite

Deterministic end-to-end coverage against two public demo applications.

| Application | Coverage |
|---|---|
| SauceDemo | Login (valid, invalid, locked-out), catalog, cart, checkout |
| TodoMVC | Create, edit, complete, delete, filtering, counter accuracy |

### Architecture

**Page Object Model with a `BasePage` class.** Page objects expose locators and actions and contain no
assertions — that keeps failure messages pointing at the spec that expressed the expectation rather than
at a shared helper.

**Custom fixtures instead of `beforeEach`.** Page objects are injected by Playwright fixtures, and
composite fixtures handle multi-step setup:

```js
test('shows the full catalog', async ({ loggedInPage }) => {
  await expect(loggedInPage.products).toHaveCount(6);
});
```

**JSON-driven parametrized tests.** Data is separated from logic, so a new scenario is a new data row.

**Token placeholders for dynamic data.** Hardcoded dates are a common flake source — a test written in
January fails in February. Data files use tokens such as `{{today}}`, resolved at runtime, with
`timezoneId` and `locale` pinned in the config so Node and the browser agree on what "today" means.

**Per-project `testIdAttribute`.** SauceDemo uses `data-test`; TodoMVC uses `data-testid`. Each Playwright
project declares its own attribute rather than forcing one global setting.

### Running

```bash
npm install
npx playwright install

npx playwright test                      # full suite
npx playwright test --ui                 # UI mode, for development
npx playwright test --project=saucedemo  # single project
npx playwright test --grep @smoke        # smoke subset
npx playwright show-report               # results
```

Failures capture a screenshot and a trace automatically. Open one with
`npx playwright show-trace test-results/<path>/trace.zip` for a DOM snapshot, network log, and console
output at every step.

---

## CI/CD

Both suites are built to run unattended:

- **`forbidOnly: !!process.env.CI`** — a stray `test.only()` fails the build instead of silently reducing
  the run to a single test. A partial pass and a full pass look identical in most dashboards.
- **Retries in CI only** — flake should stay visible locally, where it gets fixed.
- **Tagged smoke subset** for pull-request gating; full regression on merge.
- **The eval harness gates releases by exit code**, so AI quality is enforced by the same mechanism as
  test failures rather than reviewed by hand.
- **Reports and traces published as build artifacts** — failures are diagnosable from the pipeline
  without re-running anything.

---

## Repository layout

```
.
├── evals/              # AI evaluation harness — golden set, judge, support bot
├── injection/          # Adversarial and prompt-injection scenarios
├── tests/              # Playwright specs
│   └── agent/          # Agentic flow tests
├── pages/              # Page objects
├── fixtures/           # Custom fixtures
├── .github/workflows/  # CI pipeline
└── playwright.config.js
```

---

## Notes

A portfolio project built against public demo applications and a sample support assistant. It favours
patterns that hold up at scale — separation of data from logic, dependency injection, deterministic test
data, fail-closed gates — over maximising raw test count.
