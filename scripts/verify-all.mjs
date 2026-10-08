// scripts/verify-all.mjs
// Run every headless check in scripts/ and print the exit code of each.
//
// Run: npm run verify

import { spawn } from 'node:child_process';
import path from 'node:path';

const SCRIPTS = [
  'verify-controller-input.mjs',
  'verify-field-only.mjs',
  'verify-github-icon.mjs',
  'verify-hud.mjs',
  'verify-menu-geometry.mjs',
  'verify-page-layout.mjs',
  'verify-role-duel.mjs',
  'verify-views.mjs',
];

function run(script) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [path.join(import.meta.dirname, script)], { stdio: 'inherit' });
    child.on('exit', (code) => resolve(code ?? 1));
  });
}

const results = [];
for (const script of SCRIPTS) {
  console.log('--- ' + script + ' ---');
  results.push({ script, code: await run(script) });
}

console.log('');
for (const r of results) {
  console.log((r.code === 0 ? '\x1b[32m✓\x1b[0m ' : '\x1b[31m✗\x1b[0m ') + r.script + ': exit ' + r.code);
}
const failed = results.filter((r) => r.code !== 0);
console.log('');
if (failed.length === 0) console.log('All ' + results.length + ' checks passed.');
else console.log('Harness FAILED: ' + failed.length + ' of ' + results.length + ' scripts failed.');
process.exitCode = failed.length === 0 ? 0 : 1;
