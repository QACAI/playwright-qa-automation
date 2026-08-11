// judge.js — SLIDE 11.
// Runs every case in the golden set through the bot, then has a second model
// score each answer against a written rubric. Gates the "release" on TWO
// numbers: a mean score (catches drift) and a critical-fail count (catches
// disasters). Averages hide disasters — that is why there are two gates.
//
//   node judge.js

const fs = require('fs');
const path = require('path');
const { askBot } = require('./support-bot');

const JUDGE_MODEL = 'claude-sonnet-4-5';

const MEAN_FLOOR = 4.2;      // quality drift gate
const CRITICAL_MAX = 0;      // zero tolerance gate

async function judgeAnswer(testCase, answer) {
  const rubric = `You are grading a customer support assistant's answer.

The customer asked: "${testCase.question}"

The answer MUST: ${testCase.must}
The answer MUST NOT: ${testCase.mustNot}

Score 1-5 where 5 is excellent and 1 is unacceptable.
Set "critical" to true ONLY if the answer did something in the MUST NOT list.

Respond with ONLY a JSON object, no markdown fences, no other text:
{"score": <1-5>, "critical": <true|false>, "reason": "<one short sentence>"}`;

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: JUDGE_MODEL,
      max_tokens: 200,
      temperature: 0,          // the judge should be boring and repeatable
      messages: [
        { role: 'user', content: `${rubric}\n\nThe answer to grade:\n"""${answer}"""` },
      ],
    }),
  });

  if (!res.ok) throw new Error(`Judge API ${res.status}: ${await res.text()}`);

  const data = await res.json();
  const raw = data.content.map((b) => b.text || '').join('').trim();
  const clean = raw.replace(/```json/g, '').replace(/```/g, '').trim();

  try {
    return JSON.parse(clean);
  } catch {
    return { score: 0, critical: true, reason: `Judge returned unparseable output: ${clean.slice(0, 80)}` };
  }
}

(async () => {
  const cases = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'golden-set.json'), 'utf8')
  );

  console.log(`\n  Running ${cases.length} cases through the bot, then the judge...\n`);
  console.log('  ' + '-'.repeat(72) + '\n');

  const scores = [];
  let criticalFails = 0;

  for (const testCase of cases) {
    const answer = await askBot(testCase.question);
    const verdict = await judgeAnswer(testCase, answer);

    scores.push(verdict.score);
    if (verdict.critical) criticalFails++;

    const mark = verdict.critical ? 'CRITICAL' : `${verdict.score}/5     `;
    console.log(`  [${mark}]  ${testCase.id}`);
    console.log(`             Q: ${testCase.question}`);
    console.log(`             A: ${answer.replace(/\n/g, ' ').slice(0, 90)}...`);
    console.log(`             judge: ${verdict.reason}\n`);
  }

  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;

  console.log('  ' + '-'.repeat(72));
  console.log('\n  GATES\n');

  const meanPass = mean >= MEAN_FLOOR;
  const critPass = criticalFails <= CRITICAL_MAX;

  console.log(`    mean score      ${mean.toFixed(2)}  (floor ${MEAN_FLOOR})        ${meanPass ? 'PASS' : 'FAIL'}`);
  console.log(`    critical fails  ${criticalFails}     (max ${CRITICAL_MAX})           ${critPass ? 'PASS' : 'FAIL'}`);

  if (meanPass && critPass) {
    console.log('\n  RELEASE: ship it.\n');
    process.exit(0);
  } else {
    console.log('\n  RELEASE: blocked.\n');
    process.exit(1);   // <- this non-zero exit is what fails your CI job
  }
})().catch((err) => {
  console.error('\n  FAILED:', err.message, '\n');
  process.exit(1);
});
