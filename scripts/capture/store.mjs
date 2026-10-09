// Takes the store listing's screenshots from the current build, on live sites,
// into store/screenshots/:
//
//   yarn capture:store [--only <name>...] [--no-build]

import fs from 'node:fs';
import path from 'node:path';

import { bin, rootDir, runOrExit } from '../lib/cli.mjs';
import { launch } from './browser.mjs';
import { SHOTS } from './shots.mjs';

const OUT_DIR = path.join(rootDir, 'store', 'screenshots');

const USAGE = `usage: yarn capture:store [--only <name>...] [--no-build]

  --only      retake just these shots, by name or number (e.g. --only 2-chat 4)
  --no-build  skip the rebuild (dist must already be current)

Shots:
${SHOTS.map(shot => `  ${shot.name.padEnd(20)}${shot.about}`).join('\n')}
`;

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  process.stdout.write(USAGE);
  process.exit(0);
}

const only = args.includes('--only')
  ? args.slice(args.indexOf('--only') + 1).filter(arg => !arg.startsWith('--'))
  : [];
const shots = only.length
  ? SHOTS.filter(({ name }) =>
      only.some(wanted => name === wanted || name.startsWith(`${wanted}-`))
    )
  : SHOTS;

if (!shots.length) {
  console.error(`No shot named ${only.join(', ')}.\n\n${USAGE}`);
  process.exit(1);
}

if (!args.includes('--no-build')) {
  runOrExit(bin('yarn'), ['build']);
}

fs.mkdirSync(OUT_DIR, { recursive: true });

let failed = 0;

// One at a time, each in a fresh browser, so no shot's state reaches another.
for (const shot of shots) {
  const file = path.join(OUT_DIR, `${shot.name}.png`);
  const browser = shot.standalone ? null : await launch(shot);

  try {
    await (shot.standalone ? shot.run(file) : shot.run(browser, file));
    console.log(`✓ ${shot.name}`);
  } catch (error) {
    failed++;
    console.error(`✗ ${shot.name}: ${error.message.split('\n')[0]}`);
  } finally {
    await browser?.close();
  }
}

console.log(`\nSaved to ${path.relative(rootDir, OUT_DIR)}/`);
process.exit(failed ? 1 : 0);
