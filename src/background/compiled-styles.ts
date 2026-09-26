import { compileStyle } from '@stylebot/css';
import { COMPILED_STYLES_VERSION, isForceImportant } from '@stylebot/styles';
import type {
  CompiledStyleMap,
  CompiledStyles,
  StyleMap,
} from '@stylebot/types';

type Compiled = { css: string; importUrls: Array<string> };

/**
 * A style postcss can't parse compiles to nothing, which is what injecting it
 * used to amount to: the parse threw and the style never applied.
 */
const compile = (css: string, forceImportant: boolean): Compiled => {
  try {
    return compileStyle(css, { forceImportant });
  } catch {
    return { css: '', importUrls: [] };
  }
};

/**
 * Builds the injectable copy of a style map, stamped with the revision of the
 * styles it was built from. Given the previous styles and their compiled copy,
 * a style whose css and !important setting are unchanged reuses its entry.
 */
export const compileStyles = (
  styles: StyleMap,
  revision: string,
  previous?: { styles: StyleMap; compiled: CompiledStyleMap }
): CompiledStyles => {
  const compiledMap: CompiledStyleMap = {};

  for (const url in styles) {
    const style = styles[url];
    const force = isForceImportant(style);
    const before = previous?.styles[url];
    const reusable =
      before?.css === style.css && isForceImportant(before) === force
        ? previous?.compiled[url]
        : undefined;

    const { css, importUrls } = reusable || compile(style.css, force);

    compiledMap[url] = {
      css,
      importUrls,
      enabled: style.enabled,
      readability: style.readability,
    };
  }

  return { version: COMPILED_STYLES_VERSION, revision, styles: compiledMap };
};
