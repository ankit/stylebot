// Used by launch-chrome.mjs for `yarn dev:chrome:locale` on macOS.

import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const MAC_EXECUTABLES = {
  chrome: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  msedge: '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
};

/**
 * Starts Chrome or Edge in the given language and attaches over CDP, since
 * Playwright refuses AppleLanguages' "(vi)" value as a page to open. Passes
 * the flags Playwright would, less the ones launch-chrome.mjs drops.
 */
export const launchWithMacLanguage = async ({
  channel,
  userDataDir,
  lang,
  headless,
}) => {
  const browserProcess = spawn(MAC_EXECUTABLES[channel], [
    `--user-data-dir=${userDataDir}`,
    '--remote-debugging-port=0',
    '--no-first-run',
    '--no-default-browser-check',
    '--enable-unsafe-extension-debugging',
    ...(headless ? ['--headless=new'] : ['--start-maximized']),
    `--lang=${lang}`,
    // Chrome also opens "(vi)" as a tab; the start page reuses it.
    '-AppleLanguages',
    `(${lang})`,
  ]);

  // Playwright closes the browsers it launches; this one is ours to close.
  const stop = () => browserProcess.kill();
  process.on('exit', stop);
  ['SIGINT', 'SIGTERM'].forEach(signal =>
    process.on(signal, () => {
      stop();
      process.exit();
    })
  );

  const endpoint = await new Promise((resolve, reject) => {
    let output = '';

    browserProcess.stderr.on('data', chunk => {
      output += chunk;
      const match = /DevTools listening on (ws:\/\/\S+)/.exec(output);

      if (match) {
        resolve(match[1]);
      }
    });
    browserProcess.on('exit', () => reject(new Error(output)));
  });

  const browser = await chromium.connectOverCDP(endpoint);

  return browser.contexts()[0];
};
