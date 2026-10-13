/*
 * Evaluates Stylebot's AI styling path: runs each case's requests through
 * headless Claude Code with the /stylebot skill and the stylebot CLI, against
 * recorded pages in a browser with the extension, for two versions of
 * Stylebot (git refs), then scores the page. See docs/styling-evals.md.
 */
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import { preparePlugin, runAgent, toolCallsIn } from './agent.mjs';
import { launchExtensionBrowser, launchOptions } from './browser.mjs';
import { measureChecks, scoreChecks } from './checks.mjs';
import { replayHars } from './replay.mjs';
import { buildExtension, buildScorer, checkoutRef, toolsOf } from './refs.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const postcss = require('postcss');

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../..');
const CACHE = path.join(HERE, '.cache');
const PAGES = path.join(HERE, 'pages');
const REFERENCES = path.join(HERE, 'references');
const VIEWPORT = { width: 1280, height: 900 };
const MAX_SHOT_HEIGHT = 2000;
const BROAD_MATCHES = 300;
const STYLE_ID = 'stylebot-eval-css';
const DEFAULT_MODEL = 'claude-sonnet-5-5';
// The page check's problem types, under their current and earlier names.
const UNREADABLE = ['unreadable-text', 'unreadable'];

const { values: args } = parseArgs({
  options: {
    base: { type: 'string', default: 'main' },
    head: { type: 'string', default: '.' },
    model: { type: 'string', default: DEFAULT_MODEL },
    effort: { type: 'string' },
    'head-model': { type: 'string' },
    'head-effort': { type: 'string' },
    cases: { type: 'string' },
    tags: { type: 'string' },
    runs: { type: 'string', default: '1' },
    concurrency: { type: 'string', default: '4' },
    record: { type: 'boolean', default: false },
    fresh: { type: 'boolean', default: false },
    references: { type: 'boolean', default: false },
  },
});

const log = (...parts) => console.log(...parts);

const slug = url =>
  url
    .replace(/^https?:\/\//, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/-+$/, '')
    .toLowerCase();

const harFor = url => path.join(PAGES, `${slug(url)}.har`);

const harsOf = testCase => [
  ...new Set(testCase.steps.map(step => harFor(step.url))),
];

/**
 * Records each page once (or again with --record), so every run and
 * variant styles the same page.
 */
const recordPages = async (browser, urls) => {
  fs.mkdirSync(PAGES, { recursive: true });

  for (const url of urls) {
    const har = harFor(url);

    if (fs.existsSync(har) && !args.record) {
      continue;
    }

    log(`Recording ${url}`);
    const context = await browser.newContext({
      viewport: VIEWPORT,
      bypassCSP: true,
    });
    await context.routeFromHAR(har, {
      update: true,
      updateContent: 'embed',
      updateMode: 'minimal',
    });
    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'load' });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(2000);
    await context.close();
  }
};

/**
 * A context of the plain browser, with no extension: for the unstyled
 * page, references and the page check.
 */
const plainContext = browser =>
  browser.newContext({ viewport: VIEWPORT, bypassCSP: true });

const openPage = async (context, url, scripts = []) => {
  const page = await context.newPage();
  await page.setViewportSize(VIEWPORT);
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(500);
  for (const script of scripts) {
    await page.addScriptTag({ content: script });
  }
  return page;
};

/**
 * Family names from the stylesheet's font-family declarations.
 */
const fontFamilies = root => {
  const families = new Set();

  root.walkDecls(decl => {
    if (
      decl.prop === 'font-family' ||
      (decl.prop.startsWith('--') && /font|family|typeface/i.test(decl.prop))
    ) {
      const family = decl.value.split(',')[0].trim().replace(/['"]/g, '');
      if (
        family &&
        !/^(serif|sans-serif|monospace|system-ui|inherit)$/.test(family)
      ) {
        families.add(family);
      }
    }
  });

  return [...families];
};

/**
 * The stylesheet as Stylebot injects it: every declaration forced, and the
 * Google Fonts it names imported.
 */
const pageCssFor = css => {
  const root = postcss.parse(css);
  root.walkDecls(decl => {
    decl.important = true;
  });

  const imports = fontFamilies(root).map(
    family =>
      `@import url('https://fonts.googleapis.com/css2?family=${encodeURIComponent(
        family
      )}:wght@400;700&display=swap');`
  );

  return [...imports, root.toString()].join('\n');
};

/**
 * The stylesheet's rules as the page check takes edits.
 */
const editsOf = css => {
  const edits = [];
  postcss.parse(css).walkRules(rule => {
    const declarations = rule.nodes
      .filter(node => node.type === 'decl')
      .map(decl => ({ property: decl.prop, value: decl.value }));
    if (declarations.length) {
      edits.push({ selector: rule.selector, declarations });
    }
  });
  return edits;
};

const injectCss = (page, css) =>
  page.evaluate(
    ({ id, text }) => {
      let style = document.getElementById(id);
      if (!style) {
        style = document.createElement('style');
        style.id = id;
        document.head.append(style);
      }
      style.textContent = text;
    },
    { id: STYLE_ID, text: pageCssFor(css) }
  );

// Web fonts load after the stylesheet that imports them; wait for both.
const settle = async page => {
  await page.waitForTimeout(300);
  await page
    .waitForLoadState('networkidle', { timeout: 8000 })
    .catch(() => undefined);
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
};

const screenshot = async (page, file) => {
  await settle(page);
  const height = await page.evaluate(
    () => document.documentElement.scrollHeight
  );
  /* A viewport as tall as the shot, rather than a full-page capture, which
   * renders the whole page first: 20 seconds on a 37,000px docs page. */
  await page.setViewportSize({
    width: VIEWPORT.width,
    height: Math.max(VIEWPORT.height, Math.min(height, MAX_SHOT_HEIGHT)),
  });
  await page.screenshot({ path: file });
  await page.setViewportSize(VIEWPORT);
};

// A step's request as the summary shows it, naming the element it's about.
const requestText = step =>
  step.scope
    ? `${step.text} (about the element at the selector ${step.scope})`
    : step.text;

/**
 * A case's reference: a stylesheet for the result it should get, or null
 * when it has none.
 */
const referenceFor = testCase => {
  const file = path.join(REFERENCES, `${testCase.id}.css`);
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
};

/**
 * Applies a case's reference stylesheet to each step's page and scores the
 * checks with it and without any styling: every check should pass with it,
 * and the ones about the request should fail without it.
 */
const runReference = async ({ browser, testCase, css, dir }) => {
  const context = await plainContext(browser);

  const checks = [];
  for (const [index, step] of testCase.steps.entries()) {
    const last = index === testCase.steps.length - 1;
    const page = await openPage(context, step.url);
    const unstyled = await measureChecks(page, step.checks);
    if (last) {
      await screenshot(page, path.join(dir, 'before.png'));
    }
    await injectCss(page, css);
    await settle(page);
    const styled = await measureChecks(page, step.checks);
    const without = scoreChecks(step.checks, unstyled, unstyled);
    checks.push(
      ...scoreChecks(step.checks, unstyled, styled).map((check, i) => ({
        ...check,
        unstyled: without[i].pass,
      }))
    );
    if (last) {
      await screenshot(page, path.join(dir, 'after.png'));
    }
    await page.close();
  }

  await context.close();
  return { case: testCase.id, checks };
};

/**
 * The CLI's answer as JSON, or null when the command failed.
 */
const cliJson = async (browser, cliArgs) => {
  const { ok, out } = await browser.cli([...cliArgs, '--json']);
  try {
    return ok ? JSON.parse(out) : null;
  } catch {
    return null;
  }
};

/**
 * Opens the url in the extension's browser, where Stylebot applies the
 * saved style as it does on any visit, and returns the page with the css
 * Stylebot has for its tab.
 */
const openStyled = async (browser, url) => {
  const page = await openPage(browser.context, url);
  await settle(page);
  const tabs = (await cliJson(browser, ['tabs'])) ?? [];
  const tab = tabs.filter(t => t.url === page.url()).pop();
  const style = tab && (await cliJson(browser, ['css', 'get', String(tab.id)]));
  return { page, css: style?.css ?? '' };
};

/**
 * The page check's problems and the selectors' match counts for the final
 * stylesheet, on a fresh copy of the unstyled page in the plain browser,
 * so every version is counted the same way.
 */
const checkPage = async ({ context, url, css, scorer }) => {
  const page = await openPage(context, url, scorer ? [scorer] : []);
  const edits = editsOf(css);
  if (scorer) {
    await page.evaluate(e => window.StylebotScore.startStyleCheck(e), edits);
  }
  await injectCss(page, css);
  const problems = scorer
    ? await page.evaluate(() => window.StylebotScore.checkStyle())
    : null;
  const matches = await page.evaluate(
    selectors =>
      selectors.map(selector => {
        try {
          return document.querySelectorAll(selector).length;
        } catch {
          return 0;
        }
      }),
    edits.map(edit => edit.selector)
  );
  await page.close();
  return { problems, matches };
};

/**
 * One case for one variant: a fresh browser with that version's extension
 * and CLI, then each step's request as a turn of the same Claude Code
 * session, the step's checks measured on the page Stylebot styles, and the
 * page check's counts on the final stylesheet.
 */
const runCase = async ({ plain, testCase, variant, scorer, dir }) => {
  const task = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sbe-')));
  const context = await plainContext(plain);
  let browser = null;

  try {
    browser = await launchExtensionBrowser({
      dir: task,
      build: variant.build,
      cli: variant.cli,
      hars: harsOf(testCase),
      viewport: VIEWPORT,
    });
    const { plugin, work, allowedTools } = preparePlugin(variant.plugin, task);
    const cwd = path.join(task, 'cwd');
    fs.mkdirSync(cwd);
    const transcript = path.join(dir, 'transcript.jsonl');

    const results = [];
    const checks = [];
    let session = null;
    let css = '';

    for (const [index, step] of testCase.steps.entries()) {
      const last = index === testCase.steps.length - 1;
      const unstyledPage = await openPage(context, step.url);
      const unstyled = await measureChecks(unstyledPage, step.checks);
      if (last) {
        await screenshot(unstyledPage, path.join(dir, 'before.png'));
      }
      await unstyledPage.close();

      const newPage = !index || testCase.steps[index - 1].url !== step.url;
      const result = await runAgent({
        prompt: newPage
          ? `/stylebot ${step.url} ${requestText(step)}`
          : requestText(step),
        cwd,
        bin: browser.bin,
        plugin,
        allowedTools,
        model: variant.model,
        effort: variant.effort,
        session,
        persist: testCase.steps.length > 1,
        transcript,
      });
      results.push(result);
      session = result.session_id;

      const styled = await openStyled(browser, step.url);
      css = styled.css;
      if (step.checks?.length) {
        checks.push(
          ...scoreChecks(
            step.checks,
            unstyled,
            await measureChecks(styled.page, step.checks)
          )
        );
      }
      if (last) {
        await screenshot(styled.page, path.join(dir, 'after.png'));
      }
      await styled.page.close();
    }

    const { problems, matches } = await checkPage({
      context,
      url: testCase.steps[testCase.steps.length - 1].url,
      css,
      scorer,
    });
    const count = types =>
      problems ? problems.filter(p => types.includes(p.type)).length : null;
    fs.cpSync(work, path.join(dir, 'work'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'final.css'), css);

    const calls = toolCallsIn(transcript);
    const commands = calls
      .filter(call => call.name === 'Bash')
      .map(call => call.input.command);
    const usage = key =>
      results.reduce((sum, result) => sum + (result.usage?.[key] ?? 0), 0);

    return {
      case: testCase.id,
      variant: variant.name,
      checks,
      unreadable: count(UNREADABLE),
      missedSurfaces: count(['missed-surface', 'clashing']),
      overridden: count(['overridden-declaration', 'no-effect']),
      zeroMatch: matches.filter(n => !n).length,
      broad: matches.filter(n => n > BROAD_MATCHES).length,
      asked: !css.trim(),
      failedTurns: results.filter(result => result.is_error).length,
      turns: results.reduce((sum, result) => sum + (result.num_turns ?? 0), 0),
      commands: commands.length,
      saves: commands.filter(command => /\bcss set\b/.test(command)).length,
      screenshots: commands.filter(command => /\bscreenshot\b/.test(command))
        .length,
      denied: results.reduce(
        (sum, result) => sum + (result.permission_denials?.length ?? 0),
        0
      ),
      tokensIn:
        usage('input_tokens') +
        usage('cache_read_input_tokens') +
        usage('cache_creation_input_tokens'),
      tokensOut: usage('output_tokens'),
      cost: results.reduce(
        (sum, result) => sum + (result.total_cost_usd ?? 0),
        0
      ),
      models: [
        ...new Set(
          results.flatMap(result =>
            Object.keys(result.modelUsage ?? {}).map(m =>
              m.replace(/-\d{8}$/, '')
            )
          )
        ),
      ],
      seconds: Math.round(
        results.reduce((sum, result) => sum + (result.duration_ms ?? 0), 0) /
          1000
      ),
      replies: results.map(result => result.result ?? ''),
      problems,
      css,
    };
  } finally {
    await browser?.context.close().catch(() => undefined);
    await context.close();
    fs.rmSync(task, { recursive: true, force: true });
  }
};

const pool = async (tasks, size) => {
  const results = [];
  let next = 0;

  await Promise.all(
    Array.from({ length: size }, async () => {
      while (next < tasks.length) {
        const index = next++;
        results[index] = await tasks[index]();
      }
    })
  );

  return results;
};

const average = values => {
  const numbers = values.filter(value => typeof value === 'number');
  return numbers.length
    ? numbers.reduce((a, b) => a + b, 0) / numbers.length
    : null;
};

const mean = values => {
  const value = average(values);
  return value === null ? '–' : Math.round(value * 10) / 10;
};

const dollars = value =>
  typeof value === 'number' && !Number.isNaN(value)
    ? `$${value.toFixed(value < 0.1 ? 4 : 2)}`
    : '–';

/**
 * How a version runs the agent, as the summary labels it.
 */
const setupOf = variant =>
  [variant.model, variant.effort && `effort ${variant.effort}`]
    .filter(Boolean)
    .join(', ');

const summarise = (results, variants, cases, references) => {
  const columns = [
    'checks',
    'unreadable',
    'missed surfaces',
    'overridden',
    'zero-match',
    'asked',
    'denied',
    'turns',
    'commands',
    'saves',
    'tokens in',
    'tokens out',
    'cost',
    'seconds',
  ];
  const row = (label, rows) => {
    const ok = rows.filter(r => !r.error);
    const checks = ok.flatMap(r => r.checks ?? []);
    const passed = checks.filter(check => check.pass).length;

    return `| ${label} | ${[
      checks.length
        ? `${passed}/${checks.length} (${Math.round(
            (passed / checks.length) * 100
          )}%)`
        : '–',
      mean(ok.map(r => r.unreadable)),
      mean(ok.map(r => r.missedSurfaces)),
      mean(ok.map(r => r.overridden)),
      mean(ok.map(r => r.zeroMatch)),
      ok.filter(r => r.asked).length,
      mean(ok.map(r => r.denied)),
      mean(ok.map(r => r.turns)),
      mean(ok.map(r => r.commands)),
      mean(ok.map(r => r.saves)),
      Math.round(average(ok.map(r => r.tokensIn))) || '–',
      Math.round(average(ok.map(r => r.tokensOut))) || '–',
      dollars(average(ok.map(r => r.cost))),
      mean(ok.map(r => r.seconds)),
    ].join(' | ')} |${
      rows.length - ok.length ? ` ${rows.length - ok.length} failed` : ''
    }`;
  };
  const header = `| | ${columns.join(' | ')} |\n|${' --- |'.repeat(
    columns.length + 1
  )}`;
  const rowsFor = (ids, variant) =>
    results.filter(r => ids.includes(r.case) && r.variant === variant);

  const overall = variants.map(v =>
    row(
      `**${v.name}**: ${v.label} · ${setupOf(v)}`,
      results.filter(r => r.variant === v.name)
    )
  );
  const byCase = cases.flatMap(c =>
    variants.map(v => row(`${c.id} · ${v.name}`, rowsFor([c.id], v.name)))
  );

  // Kinds of request read separately: a vague one shouldn't hide a theme win.
  const byTag = [...new Set(cases.flatMap(c => c.tags))].flatMap(tag => {
    const ids = cases.filter(c => c.tags.includes(tag)).map(c => c.id);
    return variants.map(v => row(`${tag} · ${v.name}`, rowsFor(ids, v.name)));
  });

  /* Every check side by side: on the unstyled page and with the reference
   * stylesheet when the case has one, then each version's; then the
   * screenshots in the same order. */
  const caseByCase = cases.flatMap(testCase =>
    Array.from({ length: Number(args.runs) }, (_, run) => {
      const folder = `${testCase.id}-${run + 1}`;
      const reference = references[testCase.id];
      const verdict = check => (check.pass ? '✓' : `✗ ${check.detail}`);
      const columns = [
        ...(reference
          ? [
              {
                name: 'unstyled',
                cell: index => (reference.checks[index].unstyled ? '✓' : '✗'),
              },
              {
                name: 'reference',
                cell: index => verdict(reference.checks[index]),
                shot: `${testCase.id}-1/reference/after.png`,
              },
            ]
          : []),
        ...variants.map(v => {
          const result = results.find(
            r =>
              r.case === testCase.id &&
              r.run === run + 1 &&
              r.variant === v.name
          );
          return {
            name: v.name,
            result,
            cell: index => {
              if (!result || result.error) {
                return result?.error ? 'failed to run' : '–';
              }
              return verdict(result.checks[index]);
            },
            shot: `${folder}/${v.name}/after.png`,
          };
        }),
      ];
      const scored =
        reference ?? columns.map(c => c.result).find(r => r && !r.error);
      const checks = scored?.checks.length
        ? [
            `| check | ${columns.map(c => c.name).join(' | ')} |`,
            `|${' --- |'.repeat(columns.length + 1)}`,
            ...scored.checks.map(
              (check, index) =>
                `| ${check.what} | ${columns
                  .map(c => c.cell(index))
                  .join(' | ')} |`
            ),
          ]
        : ['No checks.'];
      const shown = columns.filter(c => c.shot);
      const original = reference
        ? `${testCase.id}-1/reference/before.png`
        : `${folder}/${variants[0]?.name}/before.png`;
      const shots = [
        `| original | ${shown.map(c => c.name).join(' | ')} |`,
        `|${' --- |'.repeat(shown.length + 1)}`,
        `| ![original](${original}) | ${shown
          .map(c => `![${c.name}](${c.shot})`)
          .join(' | ')} |`,
      ];

      return [
        `### ${testCase.id}${variants.length ? ` · run ${run + 1}` : ''}`,
        testCase.steps
          .map((step, index) => `${index + 1}. ${requestText(step)}`)
          .join('\n'),
        checks.join('\n'),
        shots.join('\n'),
      ];
    }).flat()
  );

  return [
    `# Styling eval`,
    `${args.runs} run(s) per case. Each case runs /stylebot in headless Claude Code with that version's skill and CLI. Checks are measured on the page Stylebot styles after each step, and on the unstyled page and with the case's reference stylesheet when it has one. Tokens, cost (as Claude Code estimates it) and seconds are means per case, as are turns (the agent's model calls), commands (stylebot commands it ran), saves (css set) and denied (tool calls refused as outside what the skill allows). Unreadable, missed surfaces, overridden and zero-match are counted on the final stylesheet; asked counts cases that ended with no CSS saved.`,
    ...(variants.length
      ? [
          `## Overall`,
          [header, ...overall].join('\n'),
          `## By kind of request`,
          [header, ...byTag].join('\n'),
          `## By case`,
          [header, ...byCase].join('\n'),
        ]
      : []),
    `## Case by case`,
    ...caseByCase,
  ].join('\n\n');
};

const hash = (...parts) =>
  createHash('sha256').update(parts.join('\0')).digest('hex').slice(0, 20);

/**
 * Runs work whose output lands in dir, or copies it from the cache when
 * the same key ran before: the same code, case, run and model.
 */
const cached = async (key, dir, work) => {
  const entry = path.join(CACHE, 'results', key);
  const file = path.join(entry, 'result.json');

  if (!args.fresh && fs.existsSync(file)) {
    fs.cpSync(entry, dir, { recursive: true });
    return { ...JSON.parse(fs.readFileSync(file, 'utf8')), cached: true };
  }

  const result = await work();
  fs.writeFileSync(
    path.join(dir, 'result.json'),
    JSON.stringify(result, null, 2)
  );
  fs.mkdirSync(entry, { recursive: true });
  fs.cpSync(dir, entry, { recursive: true });
  return result;
};

const main = async () => {
  const started = Date.now();
  const allCases = JSON.parse(
    fs.readFileSync(path.join(HERE, 'cases.json'), 'utf8')
  );
  const wanted = args.cases?.split(',');
  const tags = args.tags?.split(',');
  const cases = allCases.filter(
    c =>
      (!wanted || wanted.includes(c.id)) &&
      (!tags || c.tags.some(tag => tags.includes(tag))) &&
      (!args.references || referenceFor(c))
  );
  if (!cases.length) {
    throw new Error('No cases match.');
  }

  const variants = [];
  // With --references, only the references run: no versions, no model calls.
  for (const [name, refName] of args.references
    ? []
    : [
        ['base', args.base],
        ['head', args.head],
      ]) {
    const checkout = checkoutRef(REPO, CACHE, refName);
    log(`Building ${name}: ${checkout.label}`);
    const head = name === 'head';
    const variant = {
      name,
      label: checkout.label,
      root: checkout.root,
      build: buildExtension(REPO, CACHE, checkout),
      ...toolsOf(checkout.root),
      model: (head && args['head-model']) || args.model,
      effort: (head && args['head-effort']) || args.effort,
    };
    variant.key = hash(checkout.key, variant.model, variant.effort ?? '');
    variants.push(variant);
    log(`${name}: ${checkout.label} · ${setupOf(variant)}`);
  }

  const scorer = await buildScorer(
    [REPO, ...variants.map(variant => variant.root)],
    path.join(CACHE, 'scorer')
  );
  if (!scorer && !args.references) {
    log(
      'No page check in either version: no unreadable or missed-surface counts.'
    );
  }

  // What a result depends on besides its case and run: the harness and scorer.
  const harness = hash(
    ...['run.mjs', 'agent.mjs', 'browser.mjs', 'refs.mjs', 'checks.mjs'].map(
      file => fs.readFileSync(path.join(HERE, file), 'utf8')
    ),
    scorer ?? ''
  );
  const resultKey = (variant, testCase, run) =>
    hash(harness, variant.key, JSON.stringify(testCase), String(run));
  const plain = await chromium.launch(launchOptions({}));
  const urls = [...new Set(cases.flatMap(c => c.steps.map(s => s.url)))];
  await recordPages(plain, urls);
  await replayHars(plain, urls.map(harFor));

  const outDir = path.join(
    HERE,
    'results',
    new Date().toISOString().replace(/[:.]/g, '-')
  );
  const tasks = cases.flatMap(testCase =>
    Array.from({ length: Number(args.runs) }, (_, run) =>
      variants.map(variant => async () => {
        const dir = path.join(
          outDir,
          `${testCase.id}-${run + 1}`,
          variant.name
        );
        fs.mkdirSync(dir, { recursive: true });
        try {
          const key = resultKey(variant, testCase, run);
          const result = {
            run: run + 1,
            key,
            ...(await cached(key, dir, () =>
              runCase({ plain, testCase, variant, scorer, dir })
            )),
          };
          const passed = result.checks.filter(check => check.pass).length;
          log(
            `✓ ${testCase.id} · ${variant.name}${
              result.cached ? ' (cached)' : ''
            }: ${
              result.checks.length
                ? `${passed}/${result.checks.length} checks`
                : 'no checks'
            }, ${result.turns} turns, ${result.commands} commands, ${dollars(
              result.cost
            )}, ${result.seconds}s`
          );
          return result;
        } catch (error) {
          log(`✗ ${testCase.id} · ${variant.name}: ${error.message}`);
          return {
            run: run + 1,
            case: testCase.id,
            variant: variant.name,
            error: error.message,
          };
        }
      })
    ).flat()
  );

  const referenceTasks = cases
    .filter(referenceFor)
    .map(testCase => async () => {
      const dir = path.join(outDir, `${testCase.id}-1`, 'reference');
      fs.mkdirSync(dir, { recursive: true });
      try {
        const result = await runReference({
          browser: plain,
          testCase,
          css: referenceFor(testCase),
          dir,
        });
        const failed = result.checks.filter(check => !check.pass);
        log(
          failed.length
            ? `⚠ ${testCase.id} · reference fails: ${failed
                .map(check => `${check.what} (${check.detail})`)
                .join('; ')}`
            : `✓ ${testCase.id} · reference passes all ${result.checks.length} checks`
        );
        return result;
      } catch (error) {
        log(`✗ ${testCase.id} · reference: ${error.message}`);
        return null;
      }
    });

  const results = await pool(tasks, Number(args.concurrency));
  const references = Object.fromEntries(
    (await pool(referenceTasks, Number(args.concurrency)))
      .filter(Boolean)
      .map(result => [result.case, result])
  );
  await plain.close();

  const ran = results.filter(r => !r.error && !r.cached);
  const spent = ran.reduce((sum, r) => sum + (r.cost ?? 0), 0);
  const summary = summarise(results, variants, cases, references);
  fs.writeFileSync(path.join(outDir, 'summary.md'), summary);
  log(
    `\n${summary}\n\n${ran.length} agent runs, about ${dollars(
      spent
    )} as Claude Code estimates it, in ${Math.round(
      (Date.now() - started) / 1000
    )}s.\nResults in ${outDir}`
  );
};

main().catch(error => {
  console.error(error);
  process.exit(1);
});
