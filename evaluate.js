// Run: node tests/evaluate.js
// Reports precision/recall for "should we nudge?" plus category accuracy.
const { analyze } = require('../src/detector');
const path = require('path');
const custom = process.argv[2];
const data = require(custom ? path.resolve(custom) : './dataset.json');

let tp = 0, fp = 0, fn = 0, tn = 0, catOk = 0, catTotal = 0;
const misses = [];

for (const item of data) {
  const ctx = item.ctx || 'friend';
  const got = analyze(item.text, ctx);
  const flagged = !!got, shouldFlag = item.expected !== null;
  if (flagged && shouldFlag) { tp++; catTotal++; if (got.id === item.expected) catOk++; else misses.push(['wrong category', item, got.id]); }
  else if (flagged && !shouldFlag) { fp++; misses.push(['false positive', item, got.id]); }
  else if (!flagged && shouldFlag) { fn++; misses.push(['missed', item, null]); }
  else tn++;
}

const precision = tp / (tp + fp || 1), recall = tp / (tp + fn || 1);
const f1 = (2 * precision * recall) / (precision + recall || 1);
const pct = (x) => (x * 100).toFixed(1) + '%';

console.log(`Messages: ${data.length}  (TP ${tp}, FP ${fp}, FN ${fn}, TN ${tn})`);
console.log(`Precision: ${pct(precision)}   Recall: ${pct(recall)}   F1: ${pct(f1)}`);
console.log(`Category accuracy (among correct flags): ${pct(catOk / (catTotal || 1))}`);
if (misses.length) {
  console.log('\nMisses:');
  for (const [kind, item, got] of misses)
    console.log(` - [${kind}] "${item.text}" (${item.ctx || 'friend'}) expected=${item.expected} got=${got}`);
}
if (!custom) process.exit(precision >= 0.85 && recall >= 0.85 ? 0 : 1);
