import { cleanGoogleWebFonts, isFontFamilyProperty } from '@stylebot/css';
import { revertEdits } from '@stylebot/chat';

import type { ChatCssPreviousValue } from '@stylebot/types';

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
