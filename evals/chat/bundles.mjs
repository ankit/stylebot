import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const esbuild = require('esbuild');

const TIERS = ['apps', 'features', 'ui', 'core'];
const RENAMED_PACKAGES = { 'inject-css': 'apps/content' };

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

const exists = (root, file) => fs.existsSync(path.join(root, file));

/**
 * The checkout to evaluate: the working tree for '.', else a detached
 * worktree of the ref, kept in the cache between runs.
 */
export const checkoutRef = (repo, cacheDir, ref) => {
  if (ref === '.') {
    return { root: repo, label: 'working tree' };
  }

  const sha = execFileSync('git', ['rev-parse', ref], { cwd: repo })
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

  return { root, label: `${ref} (${sha.slice(0, 8)})` };
};

/**
 * Builds the checkout's prompt code for Node and its page code for the
 * browser, and says which of the newer features it has.
 */
export const buildRef = async (root, outDir, nodeModules) => {
  fs.mkdirSync(outDir, { recursive: true });

  const features = {
    pageCheck: exists(root, 'src/features/page-bridge/style-check.ts'),
  };
  const alias = packageAliases(root);
  const nodePaths = [nodeModules];

  const nodeEntry = path.join(outDir, 'node-entry.ts');
  fs.writeFileSync(
    nodeEntry,
    [
      `export { buildSystemPrompt, userMessageText } from '${root}/src/features/chat/prompt';`,
      `export * as tool from '${root}/src/features/chat/apply-css-tool';`,
      `export { applyEdits } from '${root}/src/features/chat/edits';`,
    ].join('\n')
  );

  const pageEntry = path.join(outDir, 'page-entry.ts');
  fs.writeFileSync(
    pageEntry,
    [
      `export { getPageOutline } from '${root}/src/features/page-bridge/page-outline';`,
      `export { getPageCssContext } from '${root}/src/features/page-bridge/page-css';`,
      `export { countMatches } from '${root}/src/features/page-bridge/count-matches';`,
      features.pageCheck
        ? `export { startStyleCheck, checkStyle } from '${root}/src/features/page-bridge/style-check';`
        : '',
    ].join('\n')
  );

  await esbuild.build({
    entryPoints: [nodeEntry],
    outfile: path.join(outDir, 'node.cjs'),
    bundle: true,
    platform: 'node',
    format: 'cjs',
    alias,
    nodePaths,
    logLevel: 'error',
  });

  await esbuild.build({
    entryPoints: [pageEntry],
    outfile: path.join(outDir, 'page.js'),
    bundle: true,
    platform: 'browser',
    format: 'iife',
    globalName: 'StylebotEval',
    alias,
    nodePaths,
    plugins: [stubBuiltins],
    logLevel: 'error',
  });

  return {
    features,
    node: require(path.join(outDir, 'node.cjs')),
    pageScript: fs.readFileSync(path.join(outDir, 'page.js'), 'utf8'),
    nodeScript: fs.readFileSync(path.join(outDir, 'node.cjs'), 'utf8'),
  };
};

const CHECK = 'src/features/page-bridge/style-check.ts';

/**
 * Chat's page check, for scoring every variant the same way whether or not
 * it has the check itself: from the first checkout that has it, or null
 * when none does yet.
 */
export const buildScorer = async (roots, outDir) => {
  const repo = roots.find(root => exists(root, CHECK));

  if (!repo) {
    return null;
  }

  await esbuild.build({
    stdin: {
      contents: `export { startStyleCheck, checkStyle } from '${repo}/src/features/page-bridge/style-check';`,
      resolveDir: repo,
      loader: 'ts',
    },
    outfile: path.join(outDir, 'score.js'),
    bundle: true,
    platform: 'browser',
    format: 'iife',
    globalName: 'StylebotScore',
    alias: packageAliases(repo),
    nodePaths: [path.join(repo, 'node_modules')],
    plugins: [stubBuiltins],
    logLevel: 'error',
  });

  return fs.readFileSync(path.join(outDir, 'score.js'), 'utf8');
};
