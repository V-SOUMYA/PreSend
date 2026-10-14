const assert = require('assert');
const { redact } = require('../src/detector');
assert.strictEqual(redact('i live at 42 Maple Street'), 'i live at [address hidden]');
assert.strictEqual(redact('call 555-123-4567 ok'), 'call [number hidden] ok');
assert.strictEqual(redact('mail kid@example.com'), 'mail [email hidden]');
assert.strictEqual(redact('hello there'), 'hello there');
console.log('redact tests passed');
