import {
  addGoogleWebFontImport,
  cleanGoogleWebFonts,
  getPrimaryFontFamily,
  isFontFamilyProperty,
} from '@stylebot/css';
import { revertEdits } from '@stylebot/chat';
import { resolveGoogleFont } from '@stylebot/google-fonts';

import type { ChatCssEdit, ChatCssPreviousValue } from '@stylebot/types';

/**
 * Adds Google Fonts imports for any family the edits name, in font-family or
 * a font variable, as picking a font in the font field does.
 */
export const addFontImports = async (
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

/**
 * Drops the imports of fonts no longer used, once an undone reply has put
 * back the font-family values its edits replaced.
 */
export const removeFontImports = (
  css: string,
  previous: Array<ChatCssPreviousValue>
): string =>
  previous.some(({ property }) => isFontFamilyProperty(property))
    ? cleanGoogleWebFonts(css)
    : css;

/**
 * The css with a reply's edits taken back: what they replaced put back,
 * and the imports of fonts no longer used dropped.
 */
export const revertReply = (
  css: string,
  previous: Array<ChatCssPreviousValue>
): string => removeFontImports(revertEdits(css, previous), previous);
