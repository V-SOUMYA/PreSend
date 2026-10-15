const assert = require('assert');
const F = require('../src/friend');
F.reset();
assert.match(F.reply('hey', 'friend'), /hey|hi|yo/i);
assert.match(F.reply('what are you upto?', 'friend'), /game|hanging|bored|homework/i);
assert.match(F.reply('what the hell are you saying', 'friend'), /sorry|my bad/i);
assert.match(F.reply('are you a bot', 'friend'), /pretend/i);
const seen = new Set(); for (let i = 0; i < 4; i++) seen.add(F.reply('zzz qqq', 'friend'));
assert.ok(seen.size >= 3, 'fallback replies should not repeat back-to-back');
F.reset(); F.reply('hello', 'stranger');
assert.match(F.reply('ok', 'stranger'), /school/i); // first probe on 2nd stranger turn
console.log('friend tests passed');
