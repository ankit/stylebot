/*
 * Evaluates Chat's styling replies: runs each case against recorded pages for
 * two versions of Stylebot (git refs), with every model call made through
 * headless Claude Code, then scores the result. See docs/chat.md.
 */
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

import { askClaude } from './claude.mjs';
import { buildRef, buildScorer, checkoutRef } from './bundles.mjs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const postcss = require('postcss');

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../..');
const CACHE = path.join(HERE, '.cache');
const PAGES = path.join(HERE, 'pages');
const VIEWPORT = { width: 1280, height: 900 };
const MAX_SHOT_HEIGHT = 2000;
// Screenshots at this scale keep the layout but read faster for the judge.
const SHOT_SCALE = 0.7;
const MAX_FIX_ROUNDS = 1;
const BROAD_MATCHES = 300;
const STYLE_ID = 'stylebot-eval-css';

const { values: args } = parseArgs({
  options: {
    base: { type: 'string', default: 'v4' },
    head: { type: 'string', default: '.' },
    model: { type: 'string', default: 'haiku' },
    judge: { type: 'string', default: 'opus' },
    cases: { type: 'string' },
    tags: { type: 'string' },
    runs: { type: 'string', default: '1' },
    concurrency: { type: 'string', default: '6' },
    record: { type: 'boolean', default: false },
    fresh: { type: 'boolean', default: false },
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

const screenshot = async (page, file) => {
  // Web fonts load after the stylesheet that imports them; wait for both.
  await page.waitForTimeout(300);
  await page
    .waitForLoadState('networkidle', { timeout: 8000 })
    .catch(() => undefined);
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
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

// A step's request as the judge reads it, naming the element it's about.
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

const JUDGE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['done', 'looks_good', 'aesthetics', 'defects'],
  properties: {
    done: { type: 'integer', minimum: 1, maximum: 5 },
    looks_good: { type: 'integer', minimum: 1, maximum: 5 },
    aesthetics: { type: 'integer', minimum: 1, maximum: 5 },
    defects: { type: 'array', items: { type: 'string' } },
  },
};

const AESTHETICS = `- aesthetics (1-5): whether the after page is genuinely pleasing to look at, judged as a careful visual designer would, apart from defects: colors that belong together, with one restrained accent rather than many competing ones; a clear hierarchy, where titles, body and secondary text each read at their own weight; consistent spacing and type rhythm; surfaces that relate to each other; nothing garish, muddy or flat. 5 is something a designer would ship as is, 3 is acceptable but plain or uneven, 1 is unpleasant.`;

const JUDGE_SYSTEM = `You grade a browser extension that restyles web pages from a user's request. You get the requests and two screenshots of the same page, before and after. Read both images with the Read tool, then grade strictly:
- done (1-5): how fully the after page does what was asked. A named theme (Gruvbox, Nord) must use that theme's actual palette across the whole page, not just the top.
- looks_good (1-5): whether it looks polished and readable: no unreadable text, no leftover surfaces in the old colors, nothing broken.
${AESTHETICS}
- defects: each visible problem, one short line each, naming where it is. Empty when there are none.`;

const judge = async ({ requests, before, after, dir }) =>
  askClaude({
    model: args.judge,
    system: JUDGE_SYSTEM,
    prompt: `Requests, in order:\n${requests
      .map((text, index) => `${index + 1}. ${text}`)
      .join('\n')}\n\nBefore: ${before}\nAfter: ${after}`,
    schema: JUDGE_SCHEMA,
    readDir: dir,
  });

const PREFER_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['winner', 'reason'],
  properties: {
    winner: { type: 'string', enum: ['A', 'B', 'tie'] },
    reason: { type: 'string' },
  },
};

const PREFER_SYSTEM = `You compare two restylings of the same web page, made from the same user request by two versions of a browser extension. Read the original and both results with the Read tool. Pick the one a careful visual designer would rather ship: first whether it does what was asked, then which is more aesthetically pleasing (colors that belong together, clear hierarchy, consistent spacing and type, restraint, no garish or muddy areas, nothing unreadable). Answer tie only when you genuinely can't choose. Give the reason in one sentence.`;

/**
 * Asks which of the two variants' results is better, showing them in a
 * random order so the judge's position bias averages out.
 */
const prefer = async ({ requests, before, base, head, dir }) => {
  const flipped = Math.random() < 0.5;
  const [a, b] = flipped ? [head, base] : [base, head];
  const { output } = await askClaude({
    model: args.judge,
    system: PREFER_SYSTEM,
    prompt: `Requests, in order:\n${requests
      .map((text, index) => `${index + 1}. ${text}`)
      .join('\n')}\n\nOriginal: ${before}\nA: ${a}\nB: ${b}`,
    schema: PREFER_SCHEMA,
    readDir: dir,
  });
  if (output.winner === 'tie') {
    return { winner: 'tie', reason: output.reason };
  }

  const pickedBase = (output.winner === 'A') !== flipped;
  return { winner: pickedBase ? 'base' : 'head', reason: output.reason };
};

let turnCount = 0;
const turnId = () => `t${++turnCount}`;

/**
 * One case for one variant: each step's message and reply, with the fix
 * round when the variant has the page check, then the scores.
 */
const runCase = async ({ browser, testCase, variant, scorer, dir }) => {
  const { ref } = variant;
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: SHOT_SCALE,
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
  let firstShot = null;

  for (const [index, step] of testCase.steps.entries()) {
    await page?.close();
    page = await openPage(context, step.url, [ref.pageScript]);

    if (index === testCase.steps.length - 1) {
      firstShot = path.join(dir, 'before.png');
      await screenshot(page, firstShot);
    }

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
      model: args.model,
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
        model: args.model,
        system,
        prompt,
        schema: replySchema(ref),
        // As the extension calls it: Haiku without extended thinking.
        thinking: !/haiku/i.test(args.model),
      });
      calls.push({ usage: reply.usage, ms: reply.ms });

      const { text, edits } = reply.output;
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
  const afterShot = path.join(dir, 'after.png');
  await screenshot(fresh, afterShot);
  await context.close();

  const replies = turns.filter(turn => turn.role === 'assistant');
  const matches = replies.flatMap(turn => turn.matches ?? []);
  const grade = await judge({
    requests: testCase.steps.map(requestText),
    before: firstShot,
    after: afterShot,
    dir,
  });

  const result = {
    case: testCase.id,
    variant: variant.name,
    done: grade.output.done,
    looksGood: grade.output.looks_good,
    aesthetics: grade.output.aesthetics,
    defects: grade.output.defects,
    unreadable: count('unreadable'),
    clashing: count('clashing'),
    noEffect: count('no-effect'),
    zeroMatch: matches.filter(count => !count).length,
    broad: matches.filter(count => count > BROAD_MATCHES).length,
    asked: replies.some(turn => !turn.edits.length),
    calls: calls.length,
    undoneFixes,
    tokens: calls.reduce(
      (sum, call) => sum + call.usage.input + call.usage.output,
      0
    ),
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

const mean = values => {
  const numbers = values.filter(value => typeof value === 'number');
  return numbers.length
    ? Math.round((numbers.reduce((a, b) => a + b, 0) / numbers.length) * 10) /
        10
    : '–';
};

const summarise = (results, variants, preferences, cases) => {
  const columns = [
    'done',
    'looks',
    'aesthetics',
    'unreadable',
    'clashing',
    'no-effect',
    'zero-match',
    'asked',
    'undone fixes',
    'calls',
    'tokens',
    'seconds',
  ];
  const row = (label, rows) => {
    const ok = rows.filter(r => !r.error);
    return `| ${label} | ${[
      mean(ok.map(r => r.done)),
      mean(ok.map(r => r.looksGood)),
      mean(ok.map(r => r.aesthetics)),
      mean(ok.map(r => r.unreadable)),
      mean(ok.map(r => r.clashing)),
      mean(ok.map(r => r.noEffect)),
      mean(ok.map(r => r.zeroMatch)),
      ok.filter(r => r.asked).length,
      ok.reduce((sum, r) => sum + (r.undoneFixes ?? 0), 0),
      mean(ok.map(r => r.calls)),
      mean(ok.map(r => r.tokens)),
      mean(ok.map(r => r.seconds)),
    ].join(' | ')} |${
      rows.length - ok.length ? ` ${rows.length - ok.length} failed` : ''
    }`;
  };
  const header = `| | ${columns.join(' | ')} |\n|${' --- |'.repeat(
    columns.length + 1
  )}`;

  const overall = variants.map(v =>
    row(
      `**${v.name}**: ${v.ref.label}`,
      results.filter(r => r.variant === v.name)
    )
  );
  const byCase = [...new Set(results.map(r => r.case))].flatMap(id =>
    variants.map(v =>
      row(
        `${id} · ${v.name}`,
        results.filter(r => r.case === id && r.variant === v.name)
      )
    )
  );
  const defects = results
    .filter(r => r.defects?.length)
    .map(r => `- **${r.case} · ${r.variant}**: ${r.defects.join('; ')}`);

  const decided = preferences.filter(p => !p.error);
  const tally = winner => decided.filter(p => p.winner === winner).length;

  // Kinds of request read separately: a vague one shouldn't hide a theme win.
  const byTag = [...new Set(cases.flatMap(c => c.tags))].flatMap(tag => {
    const ids = cases.filter(c => c.tags.includes(tag)).map(c => c.id);
    const verdicts = decided.filter(p => ids.includes(p.case));
    const won = winner => verdicts.filter(p => p.winner === winner).length;

    return variants.map(v =>
      row(
        `${tag} · ${v.name}${
          v.name === 'head' ? ` (preferred ${won('head')}–${won('base')})` : ''
        }`,
        results.filter(r => ids.includes(r.case) && r.variant === v.name)
      )
    );
  });

  const preferred = [
    `Of ${
      decided.length
    } side-by-side comparisons, the judge preferred **head** ${tally(
      'head'
    )} times, **base** ${tally('base')} times, and called ${tally(
      'tie'
    )} a tie.`,
    ...decided.map(
      p => `- ${p.case} · run ${p.run}: **${p.winner}**. ${p.reason}`
    ),
  ];

  return [
    `# Chat eval`,
    `Model ${args.model}, judged by ${args.judge}, ${args.runs} run(s) per case. Means per case; asked counts replies that made no edits, undone fixes counts fix-up calls taken back for making text hard to read.`,
    `## Overall`,
    header,
    ...overall,
    `## By kind of request`,
    header,
    ...byTag,
    `## Preferred side by side`,
    ...preferred,
    `## By case`,
    header,
    ...byCase,
    `## Defects the judge saw`,
    ...defects,
  ]
    .join('\n\n')
    .replace(/\n\n\|/g, '\n|');
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
  const allCases = JSON.parse(
    fs.readFileSync(path.join(HERE, 'cases.json'), 'utf8')
  );
  const wanted = args.cases?.split(',');
  const tags = args.tags?.split(',');
  const cases = allCases.filter(
    c =>
      (!wanted || wanted.includes(c.id)) &&
      (!tags || c.tags.some(tag => tags.includes(tag)))
  );
  const nodeModules = path.join(REPO, 'node_modules');

  const variants = [];
  for (const [name, refName] of [
    ['base', args.base],
    ['head', args.head],
  ]) {
    const checkout = checkoutRef(REPO, CACHE, refName);
    const built = await buildRef(
      checkout.root,
      path.join(CACHE, 'build', name),
      nodeModules
    );
    variants.push({
      name,
      root: checkout.root,
      ref: { ...built, label: checkout.label },
    });
    log(
      `${name}: ${checkout.label}${
        built.features.pageCheck ? ', with page check' : ''
      }`
    );
  }

  const scorer = await buildScorer(
    [REPO, ...variants.map(variant => variant.root)],
    path.join(CACHE, 'build')
  );
  if (!scorer) {
    log('No page check in either version yet: scoring by the judge alone.');
  }

  /* What a result depends on besides its case and run: the code each
   * version runs, and the harness, judge and scorer. */
  const harness = hash(
    ...['run.mjs', 'claude.mjs', 'bundles.mjs'].map(file =>
      fs.readFileSync(path.join(HERE, file), 'utf8')
    ),
    scorer ?? '',
    args.model,
    args.judge
  );
  variants.forEach(variant => {
    variant.key = hash(variant.ref.nodeScript, variant.ref.pageScript);
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
          log(
            `✓ ${testCase.id} · ${variant.name}${
              result.cached ? ' (cached)' : ''
            }: done ${result.done}, looks ${result.looksGood}, ${
              result.problems ? result.problems.length : '–'
            } problems`
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

  const results = await pool(tasks, Number(args.concurrency));
  await browser.close();

  const pairs = cases.flatMap(testCase =>
    Array.from({ length: Number(args.runs) }, (_, run) => {
      const found = name =>
        results.find(
          r =>
            r.case === testCase.id &&
            r.run === run + 1 &&
            r.variant === name &&
            !r.error
        );
      const [base, head] = [found('base'), found('head')];

      if (!base || !head) {
        return [];
      }

      const dir = path.join(outDir, `${testCase.id}-${run + 1}`);
      return [
        async () => {
          try {
            const pairDir = path.join(dir, 'preference');
            fs.mkdirSync(pairDir, { recursive: true });
            const verdict = await cached(
              hash(harness, base.key, head.key),
              pairDir,
              () =>
                prefer({
                  requests: testCase.steps.map(requestText),
                  before: path.join(dir, 'head', 'before.png'),
                  base: path.join(dir, 'base', 'after.png'),
                  head: path.join(dir, 'head', 'after.png'),
                  dir,
                })
            );
            log(
              `⚖ ${testCase.id} · run ${run + 1}${
                verdict.cached ? ' (cached)' : ''
              }: ${verdict.winner}`
            );
            return { case: testCase.id, run: run + 1, ...verdict };
          } catch (error) {
            return { case: testCase.id, run: run + 1, error: error.message };
          }
        },
      ];
    }).flat()
  );
  const preferences = await pool(pairs, Number(args.concurrency));

  const summary = summarise(results, variants, preferences, cases);
  fs.writeFileSync(path.join(outDir, 'summary.md'), summary);
  log(`\n${summary}\n\nResults in ${outDir}`);
};

main().catch(error => {
  console.error(error);
  process.exit(1);
});
