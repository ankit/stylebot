import fs from 'fs';
import path from 'path';
import type { Plugin } from 'vite';

import { parseLocaleConfig } from '../scripts/lib/parse-locale-config';

const ID = 'virtual:stylebot-locale';
const RESOLVED_ID = '\0' + ID;

/**
 * Exposes the parsed English locale as a virtual module so the chrome.i18n
 * shim can resolve the same keys the extension does.
 */
const localePlugin = (): Plugin => ({
  name: 'stylebot-locale',

  resolveId(id) {
    return id === ID ? RESOLVED_ID : null;
  },

  load(id) {
    if (id !== RESOLVED_ID) {
      return null;
    }

    const raw = fs.readFileSync(
      path.resolve(__dirname, '../src/_locales/en.config'),
      'utf8'
    );

    return `export default ${JSON.stringify(parseLocaleConfig(raw).messages)};`;
  },
});

export default localePlugin;
