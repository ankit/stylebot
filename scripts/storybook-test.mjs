// One entry point for the Storybook interaction tests:
//
//   yarn test:storybook [--no-build | --dev] [test-storybook args]
//
// Builds Storybook, serves the static output, and points the test runner at
// it — every story is rendered and every play function's assertions run in
// headless Chromium. Everything else is passed through to `test-storybook`.

import { spawn, spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);

const USAGE = `usage: yarn test:storybook [--no-build | --dev] [test-storybook args]

  (default)   build Storybook, serve storybook-static, run — what CI runs
  --no-build  skip the build (storybook-static must already be current)
  --dev       run against \`yarn storybook\` already listening on :6006
              (pair with --watch to iterate on a file)
`;

const STATIC_PORT = 6007;
const DEV_PORT = 6006;
const OWN_FLAGS = ['--no-build', '--dev'];
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  process.stdout.write(USAGE);
  process.exit(0);
}

const dev = args.includes('--dev');

// Windows has no bare `yarn`/`test-storybook` executables, only .cmd shims.
const bin = name => (process.platform === 'win32' ? `${name}.cmd` : name);
const localBin = name => path.join(rootDir, 'node_modules', '.bin', bin(name));

const run = (command, commandArgs) =>
  spawnSync(command, commandArgs, { stdio: 'inherit', cwd: rootDir }).status;

const exitUnless = status => {
  if (status !== 0) {
    process.exit(status ?? 1);
  }
};

const waitForServer = async url => {
  const deadline = Date.now() + 30_000;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // not up yet
    }
    await new Promise(resolve => setTimeout(resolve, 250));
  }

  console.error(`Timed out waiting for ${url}`);
  process.exit(1);
};

if (!dev && !args.includes('--no-build')) {
  exitUnless(run(bin('yarn'), ['build-storybook']));
}

let server;
const port = dev ? DEV_PORT : STATIC_PORT;
const url = `http://127.0.0.1:${port}`;

if (!dev) {
  server = spawn(
    localBin('http-server'),
    ['storybook-static', '-p', String(port), '-s', '-c-1'],
    { stdio: 'ignore', cwd: rootDir }
  );
}

await waitForServer(`${url}/index.json`);

// --index-json reads stories from Storybook's own index, so stories built
// by factories (editor(), popover(), …) are found without static parsing.
const status = run(localBin('test-storybook'), [
  '--url',
  url,
  '--index-json',
  ...args.filter(arg => !OWN_FLAGS.includes(arg)),
]);

server?.kill();
process.exit(status ?? 1);
