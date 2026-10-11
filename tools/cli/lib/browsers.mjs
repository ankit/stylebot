/**
 * Finds the browsers running Stylebot, each through the host it started on
 * its own socket, and picks the one a command goes to: the only one, the
 * one named with --browser, or the one the user picks when asked.
 */
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';

import { exchange } from './exchange.mjs';
import {
  HOST_PIPE,
  IS_WINDOWS,
  PIPE_DIR,
  SHARED_SOCKET_PATH,
  SOCKETS_DIR,
  SOCKET_OVERRIDE,
} from './paths.mjs';
import { dim, isStyled } from './style.mjs';

// Long enough for a busy browser to answer, short enough not to stall a command.
const DESCRIBE_TIMEOUT_MS = 3000;

let named;

/**
 * Sends commands to the browser with this name, as `browsers` lists it.
 */
export const useBrowser = name => {
  named = name;
};

const list = dir => {
  try {
    return fs.readdirSync(dir);
  } catch {
    return [];
  }
};

/**
 * The sockets hosts listen on: one per browser profile running Stylebot,
 * plus the shared one a host started before that still listens on.
 */
export const findSockets = () => {
  if (SOCKET_OVERRIDE) {
    return [SOCKET_OVERRIDE];
  }

  if (IS_WINDOWS) {
    const pipes = list(PIPE_DIR);
    const shared = SHARED_SOCKET_PATH.slice(PIPE_DIR.length);

    return [
      ...pipes.filter(pipe => HOST_PIPE.test(pipe)),
      ...pipes.filter(pipe => pipe === shared),
    ].map(pipe => `${PIPE_DIR}${pipe}`);
  }

  return [
    ...list(SOCKETS_DIR)
      .filter(file => file.endsWith('.sock'))
      .map(file => path.join(SOCKETS_DIR, file)),
    ...(fs.existsSync(SHARED_SOCKET_PATH) ? [SHARED_SOCKET_PATH] : []),
  ];
};

/**
 * Asks the extension behind a socket which browser it runs in. Removes a
 * socket nothing listens on, left by a host that didn't get to clean up.
 */
const describe = async socket => {
  try {
    const response = await exchange(socket, 'browser', {}, DESCRIBE_TIMEOUT_MS);

    if ('result' in response) {
      return { socket, ...response.result };
    }

    // Stylebot from before this command can't say which browser it's in.
    return {
      socket,
      name: 'Browser',
      instance: path.basename(socket).replace(/\D/g, '') || 'shared',
    };
  } catch (error) {
    if (
      error.code === 'ECONNREFUSED' &&
      !IS_WINDOWS &&
      path.dirname(socket) === SOCKETS_DIR
    ) {
      fs.rmSync(socket, { force: true });
    }

    return { socket, error };
  }
};

const slugOf = name => name.toLowerCase().replace(/[^a-z\d]+/g, '-');

/**
 * Gives each browser a key to name it by: its name, such as `chrome`, or
 * with its instance id too, such as `chrome-k3f9`, when another profile of
 * the same browser runs Stylebot.
 */
export const nameBrowsers = browsers =>
  browsers.map(browser => {
    const slug = slugOf(browser.name);
    const alone =
      browsers.filter(other => slugOf(other.name) === slug).length === 1;

    return {
      ...browser,
      slug,
      key: alone ? slug : `${slug}-${browser.instance}`,
    };
  });

/**
 * The browser a name given with --browser means, if any.
 */
export const findBrowser = (browsers, name) => {
  const wanted = name.toLowerCase();

  return browsers.find(
    ({ key, slug, instance }) =>
      key === wanted || `${slug}-${instance}` === wanted
  );
};

/**
 * One line per browser: its key, then its name and the page it shows.
 */
export const describeBrowsers = (browsers, { numbered = false } = {}) => {
  const width = Math.max(...browsers.map(({ key }) => key.length));

  return browsers.map(({ key, name, page }, index) => {
    const host = page?.url ? new URL(page.url).host : '';
    const title =
      page?.title && page.title.length > 48
        ? `${page.title.slice(0, 47)}…`
        : page?.title;
    const showing = page
      ? `, showing ${[title, host && `(${host})`].filter(Boolean).join(' ')}`
      : '';

    return `  ${numbered ? `${index + 1}  ` : ''}${key.padEnd(
      width
    )}  ${name}${showing}`;
  });
};

/**
 * The browsers running Stylebot, named for --browser, and whether a socket
 * refused, for the CLI to explain why when there are none.
 */
export const connectedBrowsers = async () => {
  const described = await Promise.all(findSockets().map(describe));

  return {
    browsers: nameBrowsers(described.filter(({ error }) => !error)),
    refused: described.some(({ error }) => error?.code === 'ECONNREFUSED'),
  };
};

/**
 * Asks on the terminal which browser to use.
 */
const ask = async browsers => {
  const color = isStyled(process.stderr);
  const prompt = readline.createInterface({
    input: process.stdin,
    output: process.stderr,
  });

  prompt.on('SIGINT', () => {
    prompt.close();
    process.exit(130);
  });

  console.error(`Stylebot is running in ${browsers.length} browsers:`);
  console.error(describeBrowsers(browsers, { numbered: true }).join('\n'));

  try {
    for (;;) {
      const answer = await prompt.question(
        `Which one? (1-${browsers.length}) `
      );
      const browser = browsers[Number(answer) - 1];

      if (browser) {
        const hint = `Pass --browser ${browser.key} to skip this question.`;
        console.error(color ? dim(hint) : hint);
        return browser;
      }
    }
  } finally {
    prompt.close();
  }
};

const unreachable = code => Object.assign(new Error(code), { code });

/**
 * The socket a command goes to. With one browser running Stylebot it's that
 * one's; with several, the one named with --browser, or else the user picks
 * one on a terminal. Elsewhere, such as from an agent, it lists them to name.
 */
export const chooseSocket = async () => {
  const sockets = findSockets();

  if (!sockets.length) {
    throw unreachable('ENOENT');
  }

  if (sockets.length === 1 && !named) {
    return sockets[0];
  }

  const { browsers, refused } = await connectedBrowsers();

  if (!browsers.length) {
    throw unreachable(refused ? 'ECONNREFUSED' : 'ENOENT');
  }

  if (named) {
    const browser = findBrowser(browsers, named);

    if (!browser) {
      const sameName = browsers.find(
        ({ slug }) => slug === named.toLowerCase()
      );

      throw new Error(
        `${
          sameName
            ? `Stylebot is running in more than one ${sameName.name}.`
            : `Stylebot isn't running in a browser named "${named}".`
        } Name one with --browser:\n${describeBrowsers(browsers).join('\n')}`
      );
    }

    return browser.socket;
  }

  if (browsers.length === 1) {
    return browsers[0].socket;
  }

  if (process.stdin.isTTY && process.stderr.isTTY) {
    return (await ask(browsers)).socket;
  }

  throw new Error(
    `Stylebot is running in ${
      browsers.length
    } browsers. Name the one to use with --browser:\n${describeBrowsers(
      browsers
    ).join('\n')}`
  );
};
