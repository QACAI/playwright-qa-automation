// chat.js — SLIDE 13, the live attack.
// A support chat you type into. Attack it in front of the room.
//
//   node chat.js
//
// Type your message, hit enter. Ctrl+C to quit.

const readline = require('readline');
const { askUnguarded } = require('./unguarded-bot');

const history = [];

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log('\n  ShopFast Support');
console.log('  ' + '-'.repeat(60));
console.log('  Hi! I\'m RefundBot. How can I help you today?\n');

function prompt() {
  rl.question('  YOU  > ', async (line) => {
    if (!line.trim()) return prompt();

    history.push({ role: 'user', content: line });

    try {
      const reply = await askUnguarded(history);
      history.push({ role: 'assistant', content: reply });
      console.log(`\n  BOT  > ${reply.replace(/\n/g, '\n         ')}\n`);
    } catch (err) {
      console.error(`\n  FAILED: ${err.message}\n`);
    }

    prompt();
  });
}

prompt();
