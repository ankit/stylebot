// Takes the store listing's screenshots from the current build, on live sites,
// into store/screenshots/:
//
//   yarn capture:store [--safari] [--only <name>...] [--no-build]
//
// With --safari, the Mac App Store's set goes into store/safari/ instead, at
// 2560×1600 and without the CLI.

import fs from 'node:fs';
import path from 'node:path';

import { bin, rootDir, runOrExit } from '../lib/cli.mjs';
import { launch } from './browser.mjs';
import { SHOTS } from './shots.mjs';

const USAGE = `usage: yarn capture:store [--safari] [--only <name>...] [--no-build]

  --safari    take the Mac App Store's set, at 2560×1600, into store/safari/
  --only      retake just these shots, by name or number (e.g. --only 5-chat 2)
  --no-build  skip the rebuild (dist must already be current)

Shots:
${SHOTS.map(shot => `  ${shot.name.padEnd(20)}${shot.about}`).join('\n')}
`;

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  process.stdout.write(USAGE);
  process.exit(0);
}

const safari = args.includes('--safari');
const outDir = path.join(rootDir, 'store', safari ? 'safari' : 'screenshots');
// Drawn at 2x either way; Safari keeps those pixels for the Mac App Store.
const options = safari ? { scale: 'device' } : {};

const only = args.includes('--only')
  ? args.slice(args.indexOf('--only') + 1).filter(arg => !arg.startsWith('--'))
  : [];
const available = safari ? SHOTS.filter(shot => !shot.cli) : SHOTS;
const shots = only.length
  ? available.filter(({ name }) =>
      only.some(wanted => name === wanted || name.startsWith(`${wanted}-`))
    )
  : available;

if (!shots.length) {
  console.error(`No shot named ${only.join(', ')}.\n\n${USAGE}`);
  process.exit(1);
}

if (!args.includes('--no-build')) {
  runOrExit(bin('yarn'), ['build']);
}

fs.mkdirSync(outDir, { recursive: true });

let failed = 0;

// One at a time, each in a fresh browser, so no shot's state reaches another.
for (const shot of shots) {
  const file = path.join(outDir, `${shot.name}.png`);
  const browser = shot.standalone ? null : await launch(shot);

  try {
    await (shot.standalone ? shot.run(file) : shot.run(browser, file, options));
    console.log(`✓ ${shot.name}`);
  } catch (error) {
    failed++;
    console.error(`✗ ${shot.name}: ${error.message.split('\n')[0]}`);
  } finally {
    await browser?.close();
  }
}

console.log(`\nSaved to ${path.relative(rootDir, outDir)}/`);
process.exit(failed ? 1 : 0);
