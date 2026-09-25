// Measures what the popup and content scripts load, and reports how two
// measurements differ. Used by .github/workflows/bundle-size.yml.
//
//   node scripts/bundle-size.mjs measure <dist> > sizes.json
//   node scripts/bundle-size.mjs report <base.json> <head.json> > report.md

import { appendFileSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

const MARKER = '<!-- bundle-size-report -->';

/**
 * The files the popup page and each content script load, grouped by what
 * loads them, read from the built manifest so new entries are picked up.
 */
function getBundles(distDir) {
  const manifest = JSON.parse(
    readFileSync(path.join(distDir, 'manifest.json'), 'utf8')
  );

  const bundles = manifest.content_scripts.map(script => ({
    name: `Content script (${script.run_at ?? 'document_idle'})`,
    files: [...(script.js ?? []), ...(script.css ?? [])],
  }));

  const popupPage = manifest.action?.default_popup;

  if (popupPage) {
    const html = readFileSync(path.join(distDir, popupPage), 'utf8');
    const refs = [...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)];

    bundles.unshift({
      name: 'Popup',
      files: refs.map(([, ref]) =>
        path.posix.join(path.posix.dirname(popupPage), ref)
      ),
    });
  }

  return bundles;
}

function measure(distDir) {
  return getBundles(distDir).map(({ name, files }) => ({
    name,
    files: files.map(file => {
      const contents = readFileSync(path.join(distDir, file));
      return {
        file,
        size: contents.length,
        gzip: gzipSync(contents, { level: 9 }).length,
      };
    }),
  }));
}

function formatBytes(bytes) {
  const sign = bytes < 0 ? '-' : '';
  const abs = Math.abs(bytes);

  if (abs < 1024) {
    return `${sign}${abs} B`;
  }

  return `${sign}${(abs / 1024).toFixed(1)} KB`;
}

function formatChange(base, head) {
  if (base === undefined) {
    return 'new';
  }

  if (head === undefined) {
    return 'removed';
  }

  const diff = head - base;

  if (diff === 0) {
    return '–';
  }

  const percent = base ? ` (${((diff / base) * 100).toFixed(1)}%)` : '';
  return `${diff > 0 ? '+' : ''}${formatBytes(diff)}${percent}`;
}

const total = files =>
  files.length
    ? {
        size: files.reduce((sum, f) => sum + f.size, 0),
        gzip: files.reduce((sum, f) => sum + f.gzip, 0),
      }
    : undefined;

/**
 * A table row for one file or bundle. Gzip only counts as changed along with
 * the raw size: Vue's scoped-style ids hash each file's source, so an edit
 * can reshuffle bytes, and the gzip size, without changing what ships.
 */
function row(label, before, after) {
  const sizeChanged = before?.size !== after?.size;
  const gzipChange = sizeChanged
    ? formatChange(before?.gzip, after?.gzip)
    : '–';

  return {
    sizeChanged,
    line: `| ${label} | ${
      after ? formatBytes(after.size) : '–'
    } | ${formatChange(before?.size, after?.size)} | ${
      after ? formatBytes(after.gzip) : '–'
    } | ${gzipChange} |`,
  };
}

/**
 * A Markdown table of each bundle's size and gzip size against the base,
 * with a row per file when a bundle loads more than one.
 */
function report(base, head) {
  const names = [...new Set([...base, ...head].map(({ name }) => name))];
  const rows = [];
  let changed = false;

  for (const name of names) {
    const baseFiles = base.find(b => b.name === name)?.files ?? [];
    const headFiles = head.find(b => b.name === name)?.files ?? [];
    const fileNames = [
      ...new Set([...baseFiles, ...headFiles].map(({ file }) => file)),
    ];

    const bundle = row(`**${name}**`, total(baseFiles), total(headFiles));
    rows.push(bundle.line);
    changed = changed || bundle.sizeChanged;

    if (fileNames.length > 1) {
      for (const file of fileNames) {
        const fileRow = row(
          `\`${file}\``,
          baseFiles.find(f => f.file === file),
          headFiles.find(f => f.file === file)
        );

        rows.push(fileRow.line);
        changed = changed || fileRow.sizeChanged;
      }
    }
  }

  const summary = changed
    ? 'This PR changes what the popup or content scripts load.'
    : 'No change to what the popup or content scripts load.';

  return {
    changed,
    markdown: [
      MARKER,
      '### Bundle size',
      '',
      summary,
      '',
      '| Bundle | Size | Change | Gzip | Change |',
      '| --- | ---: | ---: | ---: | ---: |',
      ...rows,
      '',
    ].join('\n'),
  };
}

const [command, ...args] = process.argv.slice(2);

if (command === 'measure') {
  process.stdout.write(`${JSON.stringify(measure(args[0]), null, 2)}\n`);
} else if (command === 'report') {
  const [basePath, headPath] = args;
  const { changed, markdown } = report(
    JSON.parse(readFileSync(basePath, 'utf8')),
    JSON.parse(readFileSync(headPath, 'utf8'))
  );

  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `changed=${changed}\n`);
  }

  process.stdout.write(markdown);
} else {
  console.error(
    'Usage: bundle-size.mjs measure <dist> | report <base.json> <head.json>'
  );
  process.exit(1);
}
