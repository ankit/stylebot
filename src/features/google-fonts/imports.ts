import {
  addGoogleWebFontImport,
  cleanGoogleWebFonts,
  getPrimaryFontFamily,
  isFontFamilyProperty,
} from '@stylebot/css';
import type { ChatCssEdit } from '@stylebot/types';

import { resolveGoogleFont } from './fonts';

/**
 * Adds Google Fonts imports for any family the edits name, in font-family or
 * a font variable, as picking a font in the font field does, and drops
 * imports of fonts the css no longer uses.
 */
export const addGoogleFontImports = async (
  css: string,
  edits: Array<ChatCssEdit>
): Promise<string> => {
  const families = edits.flatMap(edit =>
    edit.declarations
      .filter(declaration => isFontFamilyProperty(declaration.property))
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
