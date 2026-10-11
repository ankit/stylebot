import { spawnSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';

const bundleId = 'dev.stylebot.Stylebot';

const lsregister =
  '/System/Library/Frameworks/CoreServices.framework/Frameworks/' +
  'LaunchServices.framework/Support/lsregister';

/**
 * Paths of every Stylebot.app macOS knows about: those Launch Services has
 * registered, and those built into Xcode's DerivedData, archives included.
 */
export const findStylebotApps = () => {
  const { stdout: dump } = spawnSync(lsregister, ['-dump'], {
    encoding: 'utf8',
    maxBuffer: 512 * 1024 * 1024,
  });
  const registered = dump
    .split(/^-{20,}$/m)
    .filter(block =>
      new RegExp(
        `^identifier:\\s+${bundleId.replace(/\./g, '\\.')}$`,
        'm'
      ).test(block)
    )
    .map(
      block => block.match(/^path:\s+(.+?\.app)(?: \(0x[0-9a-f]+\))?$/m)?.[1]
    )
    .filter(Boolean);

  const { stdout: built } = spawnSync(
    'find',
    [
      path.join(os.homedir(), 'Library/Developer/Xcode/DerivedData'),
      '-name',
      'Stylebot.app',
      '-type',
      'd',
      '-prune',
    ],
    { encoding: 'utf8' }
  );

  return [...new Set([...registered, ...built.split('\n').filter(Boolean)])];
};

/**
 * Removes a Stylebot.app and its extension from Launch Services and
 * PluginKit, so Safari stops loading it; the files stay where they are.
 */
export const unregisterApp = appPath => {
  spawnSync('pluginkit', [
    '-r',
    path.join(appPath, 'Contents/PlugIns/Stylebot Extension.appex'),
  ]);
  spawnSync(lsregister, ['-u', appPath]);
};

export const isSafariRunning = () =>
  spawnSync('pgrep', ['-x', 'Safari']).status === 0;
