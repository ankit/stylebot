/*
 * Evaluates Chat's styling replies: runs each case against recorded pages for
 * two versions of Stylebot (git refs), with every model call made through
 * headless Claude Code, then scores the result. See docs/chat-evals.md.
 */
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import { askClaude } from './claude.mjs';
import { buildRef, buildScorer, checkoutRef } from './bundles.mjs';
import { measureChecks, scoreChecks } from './checks.mjs';

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
const MAX_FIX_ROUNDS = 1;
const BROAD_MATCHES = 300;
const STYLE_ID = 'stylebot-eval-css';
// List prices in dollars per million tokens, input and output, uncached.
const PRICES = {
  'claude-haiku-4-5': [1, 5],
  'claude-sonnet-5': [2, 10],
  'claude-sonnet-5-5': [2, 10],
  'claude-opus-5': [5, 25],
  'claude-opus-5-5': [4, 20],
  'claude-fable-5-1': [10, 50],
};

const { values: args } = parseArgs({
  options: {
    base: { type: 'string', default: 'v4' },
    head: { type: 'string', default: '.' },
    model: { type: 'string' },
    effort: { type: 'string' },
    thinking: { type: 'string' },
    'head-model': { type: 'string' },
    'head-effort': { type: 'string' },
    'head-thinking': { type: 'string' },
    cases: { type: 'string' },
    tags: { type: 'string' },
    runs: { type: 'string', default: '1' },
    concurrency: { type: 'string', default: '6' },
    record: { type: 'boolean', default: false },
    fresh: { type: 'boolean', default: false },
    references: { type: 'boolean', default: false },
  },
});

const log = (...parts) => console.log(...parts);

/**
 * The edits with their selectors' partly hashed classes swapped for stable
 * matchers by the page, as the extension applies them.
 */
const withStableSelectors = async (page, edits) => {
  const selectors = await page.evaluate(
    list => window.StylebotEval.getStableSelectors(list),
    edits.map(edit => edit.selector)
  );
  return edits.map((edit, i) => ({ ...edit, selector: selectors[i] }));
};

const slug = url =>
  url
    .replace(/^https?:\/\//, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/-+$/, '')
    .toLowerCase();

const harFor = url => path.join(PAGES, `${slug(url)}.har`);

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

const openPage = async (context, url, scripts) => {
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'load' });
  await page.waitForTimeout(500);
  for (const script of scripts) {
    await page.addScriptTag({ content: script });
  }
  return page;
};

/**
 * The stylesheet as Stylebot injects it: every declaration forced, and the
 * Google Fonts the model named imported.
 */
const pageCssFor = css => {
  const root = postcss.parse(css);
  const families = new Set();

  root.walkDecls(decl => {
    decl.important = true;
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

  const imports = [...families].map(
    family =>
      `@import url('https://fonts.googleapis.com/css2?family=${encodeURIComponent(
        family
      )}:wght@400;700&display=swap');`
  );

  return [...imports, root.toString()].join('\n');
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

const tag = (name, body) => `<${name}>\n${body}\n</${name}>`;

// A step's request as the summary shows it, naming the element it's about.
const requestText = step =>
  step.scope
    ? `${step.text} (about the picked element: ${step.scope})`
    : step.text;

/**
 * The thread as one prompt, since headless Claude Code takes a single
 * message: each turn as the extension would replay it, then the ask.
 */
const transcriptFor = (ref, turns) => {
  const { userMessageText, tool } = ref.node;
  const parts = turns.flatMap(turn => {
    if (turn.role === 'user') {
      return [tag('user', userMessageText(turn))];
    }

    const rounds = tool.roundsOf
      ? tool.roundsOf(turn)
      : [{ text: turn.text, edits: turn.edits, matches: turn.matches }];

    return rounds.flatMap(round => [
      ...(round.text ? [tag('assistant', round.text)] : []),
      ...(round.edits.length
        ? [
            tag('apply_css', JSON.stringify({ edits: round.edits })),
            tag(
              'apply_css_result',
              tool.roundsOf
                ? tool.toolResultFor(turn, round)
                : tool.toolResultFor(turn)
            ),
          ]
        : []),
    ]);
  });

  return [
    tag('conversation', parts.join('\n')),
    'Continue as the assistant from the end of the conversation. Reply as JSON: "text" is what you say to the user, and "edits" are the edits of your apply_css call, or an empty list when you make no call.',
  ].join('\n\n');
};

const replySchema = ref => ({
  type: 'object',
  additionalProperties: false,
  required: ['text', 'edits'],
  properties: {
    text: { type: 'string' },
    edits: ref.node.tool.TOOL_SCHEMA.properties.edits,
  },
});

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
  const context = await browser.newContext({
    viewport: VIEWPORT,
    bypassCSP: true,
  });
  for (const step of testCase.steps) {
    await context.routeFromHAR(harFor(step.url), { notFound: 'fallback' });
  }

  const checks = [];
  for (const [index, step] of testCase.steps.entries()) {
    const last = index === testCase.steps.length - 1;
    const page = await openPage(context, step.url, []);
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
 * What a call would cost at list prices without caching, as a one-off
 * reply from the extension does; NaN for a model with no listed price.
 */
const costOf = ({ model, usage }) => {
  const [input, output] = PRICES[model] ?? [NaN, NaN];
  return (usage.input * input + usage.output * output) / 1e6;
};

let turnCount = 0;
const turnId = () => `t${++turnCount}`;

/**
 * One case for one variant: each step's message and reply, with the fix
 * round when the variant has the page check, the step's measured checks,
 * then the page check's counts on the final page.
 */
const runCase = async ({ browser, testCase, variant, scorer, dir }) => {
  const { ref } = variant;
  const context = await browser.newContext({
    viewport: VIEWPORT,
    bypassCSP: true,
  });
  for (const step of testCase.steps) {
    await context.routeFromHAR(harFor(step.url), { notFound: 'fallback' });
  }

  const turns = [];
  const calls = [];
  let undoneFixes = 0;
  let css = '';
  let page = null;
  const checks = [];

  for (const [index, step] of testCase.steps.entries()) {
    await page?.close();
    page = await openPage(context, step.url, [ref.pageScript]);

    if (index === testCase.steps.length - 1) {
      await screenshot(page, path.join(dir, 'before.png'));
    }

    const unstyled = await measureChecks(page, step.checks);
    await injectCss(page, css);

    const previousUser = [...turns]
      .reverse()
      .find(turn => turn.role === 'user');
    turns.push({
      role: 'user',
      id: turnId(),
      text: step.text,
      href: step.url,
      // A picked element, as the inspector would send it with the message.
      ...(step.scope ? { scope: step.scope } : {}),
      ...(previousUser && previousUser.href !== step.url
        ? { newPage: true }
        : {}),
    });

    const assistant = {
      role: 'assistant',
      id: turnId(),
      text: '',
      edits: [],
      previous: [],
      applied: true,
      model: variant.model,
    };
    const rounds = [];

    for (;;) {
      const facts = await page.evaluate(
        selector => ({
          url: location.href,
          title: document.title,
          outline: window.StylebotEval.getPageOutline(),
          pageCss: window.StylebotEval.getPageCssContext(selector),
        }),
        step.scope ?? ''
      );
      const system = ref.node.buildSystemPrompt({
        ...facts,
        css,
        ...(step.scope ? { selector: step.scope } : {}),
      });
      const replyTurn = rounds.length
        ? {
            ...assistant,
            ...combine(rounds),
            ...(ref.node.tool.roundsOf ? { rounds } : {}),
          }
        : null;
      const prompt = transcriptFor(
        ref,
        replyTurn ? [...turns, replyTurn] : turns
      );

      const reply = await askClaude({
        model: variant.model,
        system,
        prompt,
        schema: replySchema(ref),
        thinking: variant.thinking,
        effort: variant.effort,
      });
      calls.push({ usage: reply.usage, ms: reply.ms, model: reply.model });

      const { text } = reply.output;
      // As the extension does: partly hashed classes saved by their stable part.
      const edits = variant.ref.features.stableSelectors
        ? await withStableSelectors(page, reply.output.edits)
        : reply.output.edits;
      const round = { text, edits };
      const checking = variant.ref.features.pageCheck && edits.length;
      const cssBefore = css;

      if (checking) {
        await page.evaluate(e => window.StylebotEval.startStyleCheck(e), edits);
      }

      if (edits.length) {
        css = ref.node.applyEdits(css, edits).css;
        await injectCss(page, css);
        round.matches = await page.evaluate(
          selectors => window.StylebotEval.countMatches(selectors),
          edits.map(edit => edit.selector)
        );
      }

      if (checking) {
        const problems = await page.evaluate(() =>
          window.StylebotEval.checkStyle()
        );
        if (problems.length) {
          round.problems = problems;
        }
      }

      // As the extension does: a fix that made text hard to read is undone.
      if (rounds.length && round.problems?.some(p => p.type === 'unreadable')) {
        css = cssBefore;
        await injectCss(page, css);
        undoneFixes++;
        break;
      }

      rounds.push(round);

      if (!round.problems?.length || rounds.length > MAX_FIX_ROUNDS) {
        break;
      }
    }

    const done = { ...assistant, ...combine(rounds) };
    if (ref.node.tool.roundsOf && rounds.some(round => round.problems)) {
      done.rounds = rounds;
    }
    turns.push(done);

    if (step.checks?.length) {
      await settle(page);
      const styled = await measureChecks(page, step.checks);
      checks.push(...scoreChecks(step.checks, unstyled, styled));
    }
  }

  await page.close();

  /* Scored on a fresh copy of the last page, so the check compares the final
   * stylesheet against the page as it was. */
  const last = testCase.steps[testCase.steps.length - 1];
  const fresh = await openPage(context, last.url, scorer ? [scorer] : []);
  const allEdits = turns
    .filter(turn => turn.role === 'assistant')
    .flatMap(turn => turn.edits);
  if (scorer) {
    await fresh.evaluate(
      e => window.StylebotScore.startStyleCheck(e),
      allEdits
    );
  }
  await injectCss(fresh, css);
  const problems = scorer
    ? await fresh.evaluate(() => window.StylebotScore.checkStyle())
    : null;
  const count = type =>
    problems ? problems.filter(p => p.type === type).length : null;
  await screenshot(fresh, path.join(dir, 'after.png'));
  await context.close();

  const replies = turns.filter(turn => turn.role === 'assistant');
  const matches = replies.flatMap(turn => turn.matches ?? []);

  const result = {
    case: testCase.id,
    variant: variant.name,
    checks,
    unreadable: count('unreadable'),
    clashing: count('clashing'),
    noEffect: count('no-effect'),
    zeroMatch: matches.filter(count => !count).length,
    broad: matches.filter(count => count > BROAD_MATCHES).length,
    asked: replies.some(turn => !turn.edits.length),
    calls: calls.length,
    undoneFixes,
    tokensIn: calls.reduce((sum, call) => sum + call.usage.input, 0),
    tokensOut: calls.reduce((sum, call) => sum + call.usage.output, 0),
    thinkingTokens: calls.reduce((sum, call) => sum + call.usage.thinking, 0),
    cost: calls.reduce((sum, call) => sum + costOf(call), 0),
    models: [...new Set(calls.map(call => call.model))],
    seconds: Math.round(calls.reduce((sum, call) => sum + call.ms, 0) / 1000),
    problems,
    turns,
    css,
  };

  fs.writeFileSync(
    path.join(dir, 'result.json'),
    JSON.stringify(result, null, 2)
  );
  return result;
};

/**
 * A reply's calls as one turn: their text and edits together.
 */
function combine(rounds) {
  const matches = rounds.every(round => round.matches)
    ? rounds.flatMap(round => round.matches)
    : undefined;

  return {
    text: rounds
      .map(round => round.text)
      .filter(Boolean)
      .join('\n\n'),
    edits: rounds.flatMap(round => round.edits),
    ...(matches ? { matches } : {}),
  };
}

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
  const numbers = values.filter(value => typeof value === 'number');
  return numbers.length
    ? Math.round((numbers.reduce((a, b) => a + b, 0) / numbers.length) * 10) /
        10
    : '–';
};

const dollars = value =>
  typeof value === 'number' && !Number.isNaN(value)
    ? `$${value.toFixed(value < 0.1 ? 4 : 2)}`
    : '–';

/**
 * How a version calls the model, as the summary labels it.
 */
const setupOf = variant =>
  [
    variant.model,
    variant.effort && `effort ${variant.effort}`,
    variant.thinking && `thinking ${variant.thinking}`,
  ]
    .filter(Boolean)
    .join(', ');

/**
 * How a version's Chat calls a Claude model: the effort it sends, and no
 * thinking for Haiku, which only thinks when asked. Without a model, its
 * default one.
 */
const chatSetupFor = (node, model) => {
  const provider = node.claude;
  const id = model ?? provider?.defaultModel ?? 'claude-haiku-4-5';
  const known = provider?.models.find(entry => entry.id === id);

  return {
    model: id,
    effort: known?.requestOptions?.output_config?.effort,
    thinking: /haiku/i.test(id) ? 'off' : undefined,
  };
};

const summarise = (results, variants, cases, references) => {
  const columns = [
    'checks',
    'unreadable',
    'clashing',
    'no-effect',
    'zero-match',
    'asked',
    'undone fixes',
    'calls',
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
      mean(ok.map(r => r.clashing)),
      mean(ok.map(r => r.noEffect)),
      mean(ok.map(r => r.zeroMatch)),
      ok.filter(r => r.asked).length,
      ok.reduce((sum, r) => sum + (r.undoneFixes ?? 0), 0),
      mean(ok.map(r => r.calls)),
      Math.round(mean(ok.map(r => r.tokensIn))) || '–',
      Math.round(mean(ok.map(r => r.tokensOut))) || '–',
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
      `**${v.name}**: ${v.ref.label} · ${setupOf(v)}`,
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
    `# Chat eval`,
    `${args.runs} run(s) per case. Cost is estimated at list prices without caching, as a one-off reply pays, with thinking billed as output; tokens, cost and seconds are means per case. Checks are measured on the page after each step, and on the unstyled page and with the case's reference stylesheet when it has one; the rest are means per case, except asked, which counts cases with a reply that made no edits, and undone fixes, which counts fix-up calls taken back for making text hard to read.`,
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
 * the same key ran before: the same code, case, run and models.
 */
const cached = async (key, dir, work) => {
  const entry = path.join(CACHE, 'results', key);
  const file = path.join(entry, 'result.json');

  if (!args.fresh && fs.existsSync(file)) {
    fs.cpSync(entry, dir, { recursive: true });
    return { ...JSON.parse(fs.readFileSync(file, 'utf8')), cached: true };
  }

  const result = await work();
  fs.mkdirSync(entry, { recursive: true });
  fs.writeFileSync(
    path.join(dir, 'result.json'),
    JSON.stringify(result, null, 2)
  );
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
  const nodeModules = path.join(REPO, 'node_modules');

  const variants = [];
  // With --references, only the references run: no versions, no model calls.
  for (const [name, refName] of args.references
    ? []
    : [
        ['base', args.base],
        ['head', args.head],
      ]) {
    const checkout = checkoutRef(REPO, CACHE, refName);
    const built = await buildRef(
      checkout.root,
      path.join(CACHE, 'build', name),
      nodeModules
    );
    const head = name === 'head';
    const chat = chatSetupFor(
      built.node,
      (head && args['head-model']) || args.model
    );
    const model = chat.model;
    const effort = (head && args['head-effort']) || args.effort || chat.effort;
    const thinking =
      (head && args['head-thinking']) || args.thinking || chat.thinking;
    if (thinking && !['on', 'off'].includes(thinking)) {
      throw new Error(`--thinking takes on or off, not ${thinking}`);
    }
    const variant = {
      name,
      root: checkout.root,
      model,
      effort,
      thinking,
      ref: { ...built, label: checkout.label },
    };
    variants.push(variant);
    log(
      `${name}: ${checkout.label} · ${setupOf(variant)}${
        built.features.pageCheck ? ', with page check' : ''
      }${built.features.stableSelectors ? ', with stable selectors' : ''}`
    );
  }

  const scorer = await buildScorer(
    [REPO, ...variants.map(variant => variant.root)],
    path.join(CACHE, 'build')
  );
  if (!scorer && !args.references) {
    log(
      'No page check in either version yet: no unreadable or clashing counts.'
    );
  }

  /* What a result depends on besides its case and run: the code each
   * version runs and how it calls the model, and the harness and scorer. */
  const harness = hash(
    ...['run.mjs', 'claude.mjs', 'bundles.mjs', 'checks.mjs'].map(file =>
      fs.readFileSync(path.join(HERE, file), 'utf8')
    ),
    scorer ?? ''
  );
  variants.forEach(variant => {
    variant.key = hash(
      variant.ref.nodeScript,
      variant.ref.pageScript,
      variant.model,
      variant.effort ?? '',
      variant.thinking ?? ''
    );
  });
  const resultKey = (variant, testCase, run) =>
    hash(harness, variant.key, JSON.stringify(testCase), String(run));
  const browser = await chromium.launch();
  await recordPages(browser, [
    ...new Set(cases.flatMap(c => c.steps.map(s => s.url))),
  ]);

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
              runCase({ browser, testCase, variant, scorer, dir })
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
            }, ${result.problems ? result.problems.length : '–'} problems`
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
          browser,
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
  await browser.close();

  const ran = results.filter(r => !r.error && !r.cached);
  const calls = ran.reduce((sum, r) => sum + r.calls, 0);
  const spent = ran.reduce((sum, r) => sum + (r.cost ?? 0), 0);
  const summary = summarise(results, variants, cases, references);
  fs.writeFileSync(path.join(outDir, 'summary.md'), summary);
  log(
    `\n${summary}\n\n${calls} model calls, about ${dollars(
      spent
    )} at list prices, in ${Math.round(
      (Date.now() - started) / 1000
    )}s.\nResults in ${outDir}`
  );
};

main().catch(error => {
  console.error(error);
  process.exit(1);
});
