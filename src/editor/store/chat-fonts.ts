import {
  addGoogleWebFontImport,
  cleanGoogleWebFonts,
  getPrimaryFontFamily,
} from '@stylebot/css';
import { resolveGoogleFont } from '@stylebot/google-fonts';

import type { ChatCssEdit } from '@stylebot/types';

/**
 * Adds Google Fonts imports for any family the edits name, as picking a font
 * in the font field does.
 */
export const addFontImports = async (
  css: string,
  edits: Array<ChatCssEdit>
): Promise<string> => {
  const families = edits.flatMap(edit =>
    edit.declarations
      .filter(declaration => declaration.property === 'font-family')
      .map(declaration => getPrimaryFontFamily(declaration.value))
      .filter((family): family is string => !!family)
  );

  let next = css;

  for (const family of families) {
    const font = await resolveGoogleFont(family);

    if (font) {
      next = addGoogleWebFontImport(font, next);
    }
  }

  return families.length ? cleanGoogleWebFonts(next) : css;
};
