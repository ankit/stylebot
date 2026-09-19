// Regenerates src/google-fonts/fonts.json from Google Fonts' metadata endpoint:
// the most popular families as [name, category], most popular first. Fonts
// outside the list still apply when typed in full. Needs Node 18+.

import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const METADATA_URL = 'https://fonts.google.com/metadata/fonts';
const TOP_FONTS = 400;

const CATEGORIES = {
  'Sans Serif': 'sans-serif',
  Serif: 'serif',
  Display: 'display',
  Handwriting: 'handwriting',
  Monospace: 'monospace',
};

const outputPath = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../src/google-fonts/fonts.json'
);

const response = await fetch(METADATA_URL);

if (!response.ok) {
  console.error(`${METADATA_URL} responded with ${response.status}`);
  process.exit(1);
}

const { familyMetadataList } = await response.json();

if (!Array.isArray(familyMetadataList) || familyMetadataList.length === 0) {
  console.error('familyMetadataList is missing or empty');
  process.exit(1);
}

const fonts = familyMetadataList
  .slice()
  .sort((a, b) => a.popularity - b.popularity)
  .slice(0, TOP_FONTS)
  .map(({ family, category }) => {
    const normalized = CATEGORIES[category];

    if (!normalized) {
      throw new Error(`Unknown category "${category}" for ${family}`);
    }

    return [family, normalized];
  });

// One family per line, matching Prettier's output, so refreshes diff cleanly.
const lines = fonts.map(
  ([family, category]) =>
    `  [${JSON.stringify(family)}, ${JSON.stringify(category)}]`
);
writeFileSync(outputPath, `[\n${lines.join(',\n')}\n]\n`);
console.log(`Wrote ${fonts.length} fonts to ${path.relative('', outputPath)}`);
