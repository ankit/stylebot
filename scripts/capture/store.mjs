// Takes the store listing's screenshots from the current build, on live sites,
// into store/screenshots/:
//
//   yarn capture:store [--safari | --iphone | --ipad | --phone] [--only <name>...] [--out <dir>] [--no-build]
//
// With --safari, the Mac App Store's set goes into store/safari/ instead, at
// 2560×1600, without the CLI, each slide showing the whole window. --iphone
// and --ipad take the App Store's sets for those, into store/safari/iphone/
// and store/safari/ipad/. With --phone, the same screens are cut out,
// without their headlines, for the tour on stylebot.dev's phone layout, into
// captures/tour/.

import path from 'node:path';

import { bin, rootDir, runOrExit } from '../lib/cli.mjs';
import { launch } from './browser.mjs';
import { IPHONE, IPHONE_SHOTS } from './iphone.mjs';
import { SHOTS } from './shots.mjs';
import { capturesDir, shownPath, takeOutput } from './output.mjs';

const USAGE = `usage: yarn capture:store [--safari | --iphone | --ipad | --phone] [--only <name>...] [--out <dir>] [--no-build]

  --safari    take the Mac App Store's set, at 2560×1600 with whole
              windows, into store/safari/
  --iphone    take the App Store's iPhone set, at 1320×2868, into
              store/safari/iphone/
  --ipad      take the App Store's iPad set, at 2752×2064, into
              store/safari/ipad/
  --phone     cut the screens out for stylebot.dev's phone tour, into
              captures/tour/
  --out       save into this directory instead
  --only      retake just these shots, by name or number (e.g. --only 8-readability 2)
  --no-build  skip the rebuild (dist must already be current)

Shots:
${SHOTS.map(shot => `  ${shot.name.padEnd(20)}${shot.about}`).join('\n')}

iPhone shots:
${IPHONE_SHOTS.map(shot => `  ${shot.name.padEnd(20)}${shot.about}`).join('\n')}
`;

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  process.stdout.write(USAGE);
  process.exit(0);
}

const iphone = args.includes('--iphone');
const ipad = args.includes('--ipad');
const safari = args.includes('--safari') || ipad;
const phone = args.includes('--phone');

/**
 * Where the shots go unless --out says otherwise.
 */
const defaultDir = () => {
  if (phone) {
    return capturesDir('tour');
  }

  if (iphone || ipad) {
    return path.join(rootDir, 'store', 'safari', iphone ? 'iphone' : 'ipad');
  }

  return path.join(rootDir, 'store', safari ? 'safari' : 'screenshots');
};

const { outDir, rest } = takeOutput(args, defaultDir());
// Drawn at 2x either way; Safari keeps those pixels for the App Store.
const options = safari ? { scale: 'device' } : {};
// A 13" iPad's screen, landscape, in points; drawn at 2x.
const IPAD = { width: 1376, height: 1032 };
const device = (iphone && 'iphone') || (ipad && 'ipad') || undefined;

const only = rest.includes('--only')
  ? rest.slice(rest.indexOf('--only') + 1).filter(arg => !arg.startsWith('--'))
  : [];
const available = iphone
  ? IPHONE_SHOTS
  : SHOTS.filter(shot => (safari ? !shot.cli : !phone || shot.phone));
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

let failed = 0;

// One at a time, each in a fresh browser, so no shot's state reaches another.
for (const shot of shots) {
  const file = phone
    ? path.join(outDir, `${shot.name.replace(/^\d+-/, '')}.webp`)
    : path.join(outDir, `${shot.name}.png`);
  const browser = shot.standalone
    ? null
    : await launch({
        appearance: shot.appearance,
        device,
        scale: iphone ? IPHONE.scale : undefined,
      });

  try {
    let shotOptions = {
      ...options,
      slide: safari
        ? {
            title: (ipad && shot.slide.touchTitle) || shot.slide.title,
            accent: shot.slide.accent,
            whole: true,
            canvas: ipad ? IPAD : undefined,
          }
        : shot.slide,
    };

    if (phone) {
      shotOptions = { phone: shot.phone };
    } else if (iphone) {
      shotOptions = shot.slide;
    }

    await (shot.standalone
      ? shot.run(file, shotOptions)
      : shot.run(browser, file, shotOptions));
    console.log(`✓ ${shot.name}`);
  } catch (error) {
    failed++;
    console.error(`✗ ${shot.name}: ${error.message.split('\n')[0]}`);
  } finally {
    await browser?.close();
  }
}

console.log(`\nSaved to ${shownPath(outDir)}/`);
process.exit(failed ? 1 : 0);
