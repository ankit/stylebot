// Unregisters every Stylebot.app except the one in /Applications, so a
// TestFlight or App Store install is the only Stylebot Safari loads. Run it
// with Safari quit, before installing a TestFlight build.

import { findStylebotApps, isSafariRunning, unregisterApp } from './copies.mjs';

if (process.platform !== 'darwin') {
  console.error('This cleans up Safari builds on macOS.');
  process.exit(1);
}

if (isSafariRunning()) {
  console.error(
    'Quit Safari first; removing its extension while it runs can break it.'
  );
  process.exit(1);
}

const installed = '/Applications/Stylebot.app';
const others = findStylebotApps().filter(app => app !== installed);

if (others.length === 0) {
  console.log('No other copies of Stylebot.app are registered.');
} else {
  others.forEach(app => {
    unregisterApp(app);
    console.log(`Unregistered ${app}`);
  });
}

console.log(
  findStylebotApps().includes(installed)
    ? `Kept ${installed}.`
    : `Nothing is installed at ${installed} yet; install it from TestFlight.`
);
