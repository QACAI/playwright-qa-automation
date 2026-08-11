// three-runs.js — SLIDE 10.
// Asks the bot the SAME question three times. Prints three different answers.
// This is the whole point of slide 10: exact-match assertions are dead here.
//
//   node three-runs.js

const { askBot } = require('./support-bot');

const QUESTION = 'How do I track my order?';

(async () => {
  console.log('\n  Question asked three times:');
  console.log(`  "${QUESTION}"\n`);
  console.log('  ' + '-'.repeat(64) + '\n');

  for (let i = 1; i <= 3; i++) {
    const answer = await askBot(QUESTION);
    console.log(`  RUN ${i}`);
    console.log(`  ${answer.replace(/\n/g, '\n  ')}\n`);
  }

  console.log('  ' + '-'.repeat(64));
  console.log('\n  Three runs. Three different answers. All arguably correct.');
  console.log('  expect(answer).toBe("...") is now a broken test.\n');
})().catch((err) => {
  console.error('\n  FAILED:', err.message, '\n');
  process.exit(1);
});
