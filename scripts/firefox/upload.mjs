// Packages the extension and uploads it to AMO. AMO has no drafts, so it's
// only validated unless --submit is passed, which creates the version, with
// its source and the changelog's notes, and sends it to review.
//
//   yarn upload:firefox [--submit]

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';

import { bin, rootDir, runOrExit } from '../lib/cli.mjs';
import { firefoxEnv, uploadToFirefox } from '../stores/firefox.mjs';
import { prepareUpload, releaseDir, runUpload } from '../stores/shared.mjs';

const { values: flags } = parseArgs({
  options: { submit: { type: 'boolean' } },
});

/**
 * The bullets of this version's CHANGELOG section, as AMO's release notes.
 */
const getReleaseNotes = version => {
  const changelog = readFileSync(path.join(rootDir, 'CHANGELOG.md'), 'utf8');
  const heading = `## Version ${version.replaceAll('.', '\\.')} \\(.*\\)\\n`;
  const section = changelog.match(
    new RegExp(`${heading}([^]*?)(?=\\n## |$)`)
  )?.[1];

  if (!section) {
    throw new Error(`CHANGELOG.md has no section for ${version}.`);
  }

  return section.trim();
};

runUpload(async () => {
  const version = prepareUpload(firefoxEnv);
  const releaseNotes = getReleaseNotes(version);

  runOrExit(bin('yarn'), ['package:firefox']);

  const link = await uploadToFirefox(
    {
      extensionZip: path.join(releaseDir, `stylebot-${version}-firefox.zip`),
      sourceZip: path.join(releaseDir, `stylebot-${version}-source.zip`),
      releaseNotes,
    },
    flags.submit
  );

  return link
    ? `Submitted ${version} for review: ${link}`
    : `AMO validated ${version}. Run with --submit to submit it for review.`;
});
