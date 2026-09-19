/* eslint-disable @typescript-eslint/no-explicit-any */

import { addGoogleWebFont, cleanGoogleWebFonts } from '../webfont';

const fontUrl =
  'https://fonts.googleapis.com/css2?family=Muli:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap';

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
  });
});
