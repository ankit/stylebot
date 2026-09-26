/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  addGoogleWebFont,
  addGoogleWebFontImport,
  cleanGoogleWebFonts,
  googleWebFontExists,
} from '../webfont';

const fontUrl =
  'https://fonts.googleapis.com/css2?family=Muli:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap';

const legacyFontUrl =
  'https://fonts.googleapis.com/css2?family=Muli:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap';

const multiWordFontUrl =
  'https://fonts.googleapis.com/css2?family=Playfair+Display+SC:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap';

let fontExists: boolean;
const sendMessage = jest.fn((_message: any) => Promise.resolve(fontExists));

global.chrome = {
  runtime: {
    sendMessage,
  },
} as unknown as typeof chrome;

describe('webfont', () => {
  beforeEach(() => {
    fontExists = true;
    sendMessage.mockClear();
  });

  describe('addGoogleWebFont', () => {
    it('adds @import rule for font at the top of css', async () => {
      const css = 'a { font-family: Muli; }';
      const output = await addGoogleWebFont('Muli', css);

      expect(output).toBe(
        `@import url(${fontUrl});\n\na { font-family: Muli; }`
      );
    });

    it('checks the font via the background page, not a content script fetch', async () => {
      await addGoogleWebFont('Muli', 'a { font-family: Muli; }');

      expect(sendMessage).toHaveBeenCalledWith({
        name: 'GetGoogleWebFontExists',
        url: fontUrl,
      });
    });

    it('does not add @import rule if it already exists', async () => {
      const css = `@import url(${fontUrl});\n\na { font-family: Muli }`;
      const output = await addGoogleWebFont('Muli', css);

      expect(output).toBe(css);
    });

    it('does not add @import rule if the font does not exist', async () => {
      fontExists = false;

      const css = 'a { font-family: Roboto; }';
      const output = await addGoogleWebFont('Invalid', css);

      expect(output).toBe(css);
    });

    it('returns the css unchanged if the background is unreachable', async () => {
      sendMessage.mockRejectedValueOnce(
        new Error('Could not establish connection.')
      );

      const css = 'a { font-family: Muli; }';
      const output = await addGoogleWebFont('Muli', css);

      expect(output).toBe(css);
    });

    it('does not look up generic keywords', async () => {
      const css = 'a { font-family: system-ui; }';

      expect(await addGoogleWebFont('system-ui', css)).toBe(css);
      expect(await googleWebFontExists('Serif')).toBe(false);
      expect(sendMessage).not.toHaveBeenCalled();
    });

    it('encodes every space in a multi-word family', async () => {
      await addGoogleWebFont('Playfair Display SC', '');

      expect(sendMessage).toHaveBeenCalledWith({
        name: 'GetGoogleWebFontExists',
        url: multiWordFontUrl,
      });
    });
  });

  describe('addGoogleWebFontImport', () => {
    it('adds the @import without checking the font exists', () => {
      const output = addGoogleWebFontImport('Muli', 'a { font-family: Muli; }');

      expect(output).toBe(
        `@import url(${fontUrl});\n\na { font-family: Muli; }`
      );
      expect(sendMessage).not.toHaveBeenCalled();
    });

    it('does not duplicate an existing @import', () => {
      const css = `@import url(${fontUrl});\n\na { font-family: Muli }`;

      expect(addGoogleWebFontImport('Muli', css)).toBe(css);
    });

    it('replaces an import of the family that asks for other weights', () => {
      const css = `@import url(${legacyFontUrl});\n\na { font-family: Muli }`;

      expect(addGoogleWebFontImport('Muli', css)).toBe(
        `@import url(${fontUrl});\n\na { font-family: Muli }`
      );
    });

    it('keeps imports of other families', () => {
      const css = `@import url(${multiWordFontUrl});\n\na { font-family: Muli }`;

      expect(addGoogleWebFontImport('Muli', css)).toBe(
        `@import url(${fontUrl});\n\n@import url(${multiWordFontUrl});\n\na { font-family: Muli }`
      );
    });
  });

  describe('cleanGoogleWebFonts', () => {
    it('removes @import rule for unused font', () => {
      const css = `@import url(${fontUrl});\n\na { color: red; }`;
      const output = cleanGoogleWebFonts(css);

      expect(output).toBe('a { color: red; }');
    });

    it('does not remove @import rule for used font', () => {
      const css = `@import url(${fontUrl});\n\na { font-family: Muli, Helvetica; }`;
      const output = cleanGoogleWebFonts(css);

      expect(output).toBe(css);
    });

    it('keeps an import saved with an older weight list', () => {
      const css = `@import url(${legacyFontUrl});\n\na { font-family: Muli; }`;

      expect(cleanGoogleWebFonts(css)).toBe(css);
    });

    it('matches a multi-word family', () => {
      const css = `@import url(${multiWordFontUrl});\n\na { font-family: "Playfair Display SC"; }`;

      expect(cleanGoogleWebFonts(css)).toBe(css);
    });

    it('keeps the @import when the first family is quoted', () => {
      const css = `@import url(${fontUrl});\n\na { font-family: "Muli", serif; }`;

      expect(cleanGoogleWebFonts(css)).toBe(css);
    });

    it('removes the @import for a family that is only a fallback', () => {
      const css = `@import url(${fontUrl});\n\na { font-family: Helvetica, Muli; }`;

      expect(cleanGoogleWebFonts(css)).toBe(
        'a { font-family: Helvetica, Muli; }'
      );
    });
  });
});
