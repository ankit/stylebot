import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';

import { CLI_VERSION, LIB_DIR } from './package.mjs';
import { HOST_DIR, HOST_VERSION_PATH, SOCKET_PATH } from './paths.mjs';
import {
  findStylebot,
  isHostRegistered,
  launcherNode,
  registerHost,
  supportedBrowsers,
  writeLauncher,
} from './register.mjs';
import { PINK, banner, bold, dim, isStyled, linkify, rgb } from './style.mjs';

/**
 * Copies the native host into ~/.stylebot, noting this CLI's version.
 */
const copyHost = () => {
  fs.mkdirSync(HOST_DIR, { recursive: true, mode: 0o700 });

  // A copy, so the host keeps running whatever happens to this checkout.
  for (const file of ['host.mjs', 'paths.mjs']) {
    fs.copyFileSync(path.join(LIB_DIR, file), path.join(HOST_DIR, file));
  }

  fs.writeFileSync(HOST_VERSION_PATH, `${CLI_VERSION}\n`);
};

/**
 * Whether a host is listening on the socket, so Stylebot is connected.
 */
const isConnected = () =>
  new Promise(resolve => {
    const socket = net.connect(SOCKET_PATH);

    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('error', () => resolve(false));
  });

/**
 * Names joined as a sentence would: "Chrome, Edge and Arc".
 */
const sentence = names =>
  names.length > 1
    ? `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`
    : names[0];

/**
 * Names browsers for people, with the checkout's dev profiles as one.
 */
const browserNames = names => {
  const unique = [...new Set(names)];

  return unique.includes('Dev profile')
    ? [...unique.filter(name => name !== 'Dev profile'), 'your dev profiles']
    : unique;
};

/**
 * What's set up so far and what's left to do, as checklist lines: each
 * either done or a step to take, with an optional hint under it.
 */
export const checklist = ({ browsers, stylebot, connected }) => {
  const steps = [{ done: true, text: 'Set up the stylebot command' }];

  if (!browsers.length) {
    return [
      ...steps,
      {
        done: false,
        text: 'Install Chrome or Edge, then run `stylebot install` again',
      },
    ];
  }

  steps.push({ done: true, text: `Found ${sentence(browserNames(browsers))}` });

  if (stylebot?.length) {
    steps.push({
      done: true,
      text: `Stylebot is in ${sentence(browserNames(stylebot))}`,
    });
  } else if (stylebot) {
    steps.push({
      done: false,
      text: 'Add Stylebot to your browser',
      hint: 'stylebot.dev',
    });
  }

  steps.push(
    connected
      ? { done: true, text: 'Connected to Stylebot' }
      : {
          done: false,
          text: 'Turn on "Let apps on this computer control Stylebot" in Stylebot\'s settings',
          hint: 'Already on? Reload Stylebot. Stuck? stylebot.dev/cli',
        }
  );

  return steps;
};

/**
 * Prints the checklist, in color with the icon on a terminal.
 */
const printChecklist = steps => {
  const color = isStyled(process.stdout);
  const plain = text => text;
  const strong = color ? bold : plain;
  const faint = color ? dim : plain;
  const accent = color ? text => rgb(PINK, text) : plain;
  const link = color ? linkify : plain;

  const ready = steps.every(step => step.done);
  const tagline = ready ? "You're all set." : "Let's get your browser talking.";
  const header = color ? [...banner('stylebot', tagline), ''] : [];

  const stepLines = steps.flatMap(({ done, text, hint }) => [
    done ? `  ${accent('✓')}  ${text}` : `  ${faint('○')}  ${strong(text)}`,
    ...(hint ? [`     ${faint(link(hint))}`] : []),
  ]);

  const example = strong('stylebot open news.ycombinator.com');
  const nextStep = ready
    ? `  Try ${example}, or ask Claude Code to restyle a site.`
    : `  Run ${strong('stylebot install')} again to check.`;
  const browsers = faint(`  Works with ${sentence(supportedBrowsers())}.`);

  console.log([...header, ...stepLines, '', nextStep, browsers, ''].join('\n'));
};

/**
 * Copies the native host into ~/.stylebot, registers it with the
 * checkout's dev profiles and the installed browsers, and shows what's
 * left to connect.
 */
export const install = async () => {
  copyHost();

  const registrations = registerHost();

  printChecklist(
    checklist({
      browsers: registrations.map(({ browser }) => browser),
      stylebot: findStylebot(),
      connected: await isConnected(),
    })
  );
};

/**
 * Brings an installed host up to date with this CLI: copies it again when
 * another version installed it, and repins the launcher when its node is
 * gone, such as after a node upgrade. Reports whether the launcher was
 * repinned, since the browser can't have started the host before it.
 */
export const refreshHost = () => {
  const node = launcherNode();

  if (!node) {
    return { repinned: false };
  }

  const installed = fs.existsSync(HOST_VERSION_PATH)
    ? fs.readFileSync(HOST_VERSION_PATH, 'utf8').trim()
    : undefined;

  if (installed !== CLI_VERSION) {
    copyHost();
  }

  if (fs.existsSync(node)) {
    return { repinned: false };
  }

  writeLauncher();
  return { repinned: true };
};

/**
 * Gets the host ready before a command: sets it up the first time, saying
 * for which browsers, and after that keeps it up to date.
 */
export const prepareHost = () => {
  if (isHostRegistered()) {
    return refreshHost();
  }

  copyHost();

  const browsers = registerHost().map(({ browser }) => browser);

  if (browsers.length) {
    console.error(`stylebot: Set up for ${sentence(browserNames(browsers))}.`);
  }

  return { repinned: false };
};
