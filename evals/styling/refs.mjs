import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const esbuild = require('esbuild');

const TIERS = ['apps', 'features', 'ui', 'core'];
const RENAMED_PACKAGES = { 'inject-css': 'apps/content' };
const CLI = 'tools/cli/lib/cli.mjs';
const PLUGIN = 'tools/claude-plugin';
const SKILL = `${PLUGIN}/skills/stylebot/SKILL.md`;
// Where a checkout keeps the page check, newest first.
const STYLE_CHECKS = [
  'src/features/page-bridge/page-reading/style-check',
  'src/features/page-bridge/chat/style-check',
];

const git = (cwd, args) =>
  execFileSync('git', args, { cwd, maxBuffer: 1 << 28 });

const exists = (root, file) => fs.existsSync(path.join(root, file));

/**
 * Every @stylebot/ package of the checkout at root, as esbuild aliases.
 */
const packageAliases = root => {
  const aliases = {};

  TIERS.forEach(tier => {
    fs.readdirSync(path.join(root, 'src', tier), { withFileTypes: true })
      .filter(entry => entry.isDirectory())
      .forEach(entry => {
        aliases[`@stylebot/${entry.name}`] = path.join(
          root,
          'src',
          tier,
          entry.name
        );
      });
  });

  Object.entries(RENAMED_PACKAGES).forEach(([name, dir]) => {
    aliases[`@stylebot/${name}`] = path.join(root, 'src', dir);
  });

  return aliases;
};

/**
 * What the working tree's code is: the commit it's on, its changes and its
 * new files, so an unchanged tree reuses its build and results.
 */
const workingTreeKey = repo => {
  const hash = createHash('sha256');
  hash.update(git(repo, ['rev-parse', 'HEAD']));
  hash.update(git(repo, ['diff', 'HEAD', '--binary']));
  git(repo, ['ls-files', '--others', '--exclude-standard', '-z'])
    .toString()
    .split('\0')
    .filter(Boolean)
    .forEach(file => {
      hash.update(file);
      hash.update(fs.readFileSync(path.join(repo, file)));
    });
  return hash.digest('hex').slice(0, 20);
};

/**
 * The checkout to evaluate: the working tree for '.', else a detached
 * worktree of the ref, kept in the cache between runs. Refuses one from
 * before the CLI and its Claude Code skill, which there's nothing to run in.
 */
export const checkoutRef = (repo, cacheDir, ref) => {
  let checkout;

  if (ref === '.') {
    checkout = { root: repo, label: 'working tree', key: workingTreeKey(repo) };
  } else {
    const sha = git(repo, ['rev-parse', `${ref}^{commit}`])
      .toString()
      .trim();
    const root = path.join(cacheDir, 'refs', sha);

    if (!fs.existsSync(root)) {
      fs.mkdirSync(path.dirname(root), { recursive: true });
      execFileSync('git', ['worktree', 'add', '--detach', root, sha], {
        cwd: repo,
        stdio: 'ignore',
      });
    }

    checkout = { root, label: `${ref} (${sha.slice(0, 8)})`, key: sha };
  }

  const missing = [CLI, SKILL].filter(file => !exists(checkout.root, file));
  if (missing.length) {
    throw new Error(
      `${
        checkout.label
      } predates the stylebot CLI and its /stylebot skill (no ${missing.join(
        ' or '
      )}), so there's nothing to evaluate. Pick a later ref.`
    );
  }

  return checkout;
};

/**
 * Builds the checkout's extension as `yarn build:preview` does, with the
 * store's key so it gets the id the CLI's host allows, into the cache, and
 * returns its folder. A checkout whose lockfile differs from the repo's
 * gets its own dependencies first; others resolve the repo's.
 */
export const buildExtension = (repo, cacheDir, checkout) => {
  const out = path.join(cacheDir, 'builds', checkout.key);

  if (fs.existsSync(path.join(out, 'manifest.json'))) {
    return out;
  }

  const { root } = checkout;
  const modules = path.join(root, 'node_modules');
  const lock = file => fs.readFileSync(path.join(file, 'yarn.lock'), 'utf8');
  if (root !== repo && !exists(root, 'node_modules/webpack')) {
    fs.rmSync(modules, { recursive: true, force: true });
    if (lock(root) === lock(repo)) {
      fs.symlinkSync(path.join(repo, 'node_modules'), modules);
    } else {
      execFileSync('yarn', ['install', '--frozen-lockfile'], {
        cwd: root,
        stdio: 'inherit',
      });
    }
  }

  try {
    execFileSync(
      process.execPath,
      [path.join(modules, 'webpack/bin/webpack.js'), '--hide-modules'],
      {
        cwd: root,
        stdio: 'pipe',
        maxBuffer: 1 << 26,
        env: {
          ...process.env,
          NODE_ENV: 'production',
          STYLEBOT_PREVIEW: '1',
          NODE_OPTIONS: '--openssl-legacy-provider',
        },
      }
    );
  } catch (error) {
    // webpack reports errors on stdout.
    throw new Error(
      `Building ${checkout.label} failed:\n${error.stdout}${error.stderr}`
    );
  }

  fs.rmSync(out, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.cpSync(path.join(root, 'preview-dist'), out, { recursive: true });
  return out;
};

/**
 * The checkout's CLI entry point and Claude Code plugin folder.
 */
export const toolsOf = root => ({
  cli: path.join(root, CLI),
  plugin: path.join(root, PLUGIN),
});

/**
 * The page check, for counting what every version's CSS left hard to read
 * the same way: from the first checkout that has it, or null when none does.
 */
export const buildScorer = async (roots, outDir) => {
  const found = roots
    .flatMap(root => STYLE_CHECKS.map(dir => ({ root, dir })))
    .find(({ root, dir }) => exists(root, `${dir}/index.ts`));

  if (!found) {
    return null;
  }

  fs.mkdirSync(outDir, { recursive: true });
  await esbuild.build({
    stdin: {
      contents: `export { startStyleCheck, checkStyle } from '${path.join(
        found.root,
        found.dir
      )}';`,
      resolveDir: found.root,
      loader: 'ts',
    },
    outfile: path.join(outDir, 'score.js'),
    bundle: true,
    platform: 'browser',
    format: 'iife',
    globalName: 'StylebotScore',
    alias: packageAliases(found.root),
    nodePaths: [path.join(found.root, 'node_modules')],
    plugins: [stubBuiltins],
    logLevel: 'error',
  });

  return fs.readFileSync(path.join(outDir, 'score.js'), 'utf8');
};

// postcss reaches for Node's builtins in code paths the page never takes.
const stubBuiltins = {
  name: 'stub-builtins',
  setup(build) {
    build.onResolve(
      { filter: /^(fs|path|url|source-map-js|source-map)$/ },
      args => ({
        path: args.path,
        namespace: 'stub',
      })
    );
    build.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({
      contents: 'module.exports = {};',
    }));
  },
};
