import 'jest-fetch-mock';
import { addGoogleWebFont, cleanGoogleWebFonts } from '../webfont';

const fontUrl =
  'https://fonts.googleapis.com/css2?family=Muli:ital,wght@0,100;0,300;0,400;0,500;0,700;0,900;1,100;1,300;1,400;1,500;1,700;1,900&display=swap';

describe('webfont', () => {
  describe('addGoogleWebFont', () => {
    it('adds @import rule for font at the top of css', async () => {
      fetchMock.mockResponse(() => Promise.resolve({ status: 200 }));

      const css = 'a { font-family: Muli; }';
      const output = await addGoogleWebFont('Muli', css);

      expect(output).toBe(
        `@import url(${fontUrl});\n\na { font-family: Muli; }`
      );
    });

    it('does not add @import rule if it already exists', async () => {
      fetchMock.mockResponse(() => Promise.resolve({ status: 200 }));

      const css = `@import url(${fontUrl});\n\na { font-family: Muli }`;
      const output = await addGoogleWebFont('Muli', css);

      expect(output).toBe(css);
    });

    it('does not add @import rule if google web font API returns 400', async () => {
      fetchMock.mockResponse(() => Promise.resolve({ status: 400 }));

      const css = 'a { font-family: Roboto; }';
      const output = await addGoogleWebFont('Invalid', css);

      expect(output).toBe(css);
    });

    it('does not add @import rule if google web font API request fails', async () => {
      fetchMock.mockResponse(() => Promise.reject());

      const css = 'a { font-family: Roboto; }';
      const output = await addGoogleWebFont('Invalid', css);

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
