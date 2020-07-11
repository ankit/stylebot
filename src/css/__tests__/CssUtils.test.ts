import 'jest-fetch-mock';

import CssUtils from '../CssUtils';

describe('CssUtils', () => {
  describe('addGoogleWebFont', () => {
    it('adds @import rule for font at the top of css', async () => {
      fetchMock.mockResponse(() => Promise.resolve({ status: 200 }));

      const css = 'a { font-family: Muli; }';
      const output = await CssUtils.addGoogleWebFont('Muli', css);

      expect(output).toBe(
        '@import url(//fonts.googleapis.com/css?family=Muli);\na { font-family: Muli; }'
      );
    });

    it('does not add @import rule if it already exists', async () => {
      fetchMock.mockResponse(() => Promise.resolve({ status: 200 }));

      const css =
        '@import url(//fonts.googleapis.com/css?family=Muli);\na { font-family: Muli }';
      const output = await CssUtils.addGoogleWebFont('Muli', css);

      expect(output).toBe(css);
    });

    it('does not add @import rule if google web font API returns 400', async () => {
      fetchMock.mockResponse(() => Promise.resolve({ status: 400 }));

      const css = 'a { font-family: Roboto; }';
      const output = await CssUtils.addGoogleWebFont('Invalid', css);

      expect(output).toBe(css);
    });

    it('does not add @import rule if google web font API request fails', async () => {
      fetchMock.mockResponse(() => Promise.reject());

      const css = 'a { font-family: Roboto; }';
      const output = await CssUtils.addGoogleWebFont('Invalid', css);

      expect(output).toBe(css);
    });
  });

  describe('cleanGoogleWebFonts', () => {
    it('removes @import rule for unused font', () => {
      const css =
        '@import url(//fonts.googleapis.com/css?family=Muli);\na { color: red; }';

      const output = CssUtils.cleanGoogleWebFonts(css);
      expect(output).toBe('a { color: red; }');
    });

    it('does not remove @import rule for used font', () => {
      const css =
        '@import url(//fonts.googleapis.com/css?family=Muli);\na { font-family: Muli, Helvetica; }';
      const output = CssUtils.cleanGoogleWebFonts(css);
      expect(output).toBe(css);
    });
  });
});
