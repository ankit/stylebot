import { hidePage, revealPage } from '../hide-page';

const HIDE_STYLE_ID = 'stylebot-hide-page';

describe('hide-page', () => {
  afterEach(() => {
    document.getElementById(HIDE_STYLE_ID)?.remove();
  });

  describe('hidePage', () => {
    it('appends a style hiding the page to the document', () => {
      hidePage();

      const style = document.getElementById(HIDE_STYLE_ID);

      expect(style).not.toBeNull();
      expect(style?.tagName).toBe('STYLE');
      expect(style?.textContent).toContain('visibility: hidden');
      expect(style?.parentElement).toBe(document.documentElement);
    });
  });

  describe('revealPage', () => {
    it('removes the hiding style', () => {
      hidePage();
      revealPage();

      expect(document.getElementById(HIDE_STYLE_ID)).toBeNull();
    });

    it('does nothing if the page was never hidden', () => {
      expect(() => revealPage()).not.toThrow();
      expect(document.getElementById(HIDE_STYLE_ID)).toBeNull();
    });
  });
});
