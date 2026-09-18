import { getPageColors } from '../page-colors';

describe('page-colors', () => {
  describe('getPageColors', () => {
    it('returns all-empty result for an empty root', () => {
      const root = document.createElement('div');
      expect(getPageColors(root)).toEqual({ text: [], surface: [], total: 0 });
    });

    it('buckets computed color into text and computed background-color into surface', () => {
      const root = document.createElement('div');
      root.innerHTML = `
        <div style="color: #191b1f; background-color: #ffffff;">a</div>
      `;

      // jsdom's (and real browsers') getComputedStyle normalizes colors to
      // rgb(...), regardless of how they were authored.
      expect(getPageColors(root)).toEqual({
        text: ['rgb(25, 27, 31)'],
        surface: ['rgb(255, 255, 255)'],
        total: 2,
      });
    });

    it('excludes display:none elements', () => {
      const root = document.createElement('div');
      root.innerHTML = `
        <div style="display: none; color: #333333;">hidden</div>
      `;

      expect(getPageColors(root)).toEqual({ text: [], surface: [], total: 0 });
    });

    it('excludes visibility:hidden elements', () => {
      const root = document.createElement('div');
      root.innerHTML = `
        <div style="visibility: hidden; color: #444444;">hidden</div>
      `;

      expect(getPageColors(root)).toEqual({ text: [], surface: [], total: 0 });
    });

    it('excludes a fully-transparent background from the surface role', () => {
      const root = document.createElement('div');
      root.innerHTML = `
        <div style="background-color: transparent; color: #555555;">transparent-bg</div>
      `;

      expect(getPageColors(root)).toEqual({ text: ['rgb(85, 85, 85)'], surface: [], total: 1 });
    });

    it('ranks a color repeated across more elements above one seen once', () => {
      const root = document.createElement('div');
      root.innerHTML = `
        <div style="color: #111111;">a</div>
        <div style="color: #111111;">b</div>
        <div style="color: #111111;">c</div>
        <div style="color: #222222;">d</div>
      `;

      const result = getPageColors(root);
      expect(result.text).toEqual(['rgb(17, 17, 17)', 'rgb(34, 34, 34)']);
      expect(result.total).toEqual(2);
    });

    it('caps each role at 4 colors, ties broken by first-encountered order', () => {
      const root = document.createElement('div');
      root.innerHTML = `
        <div style="background-color: #aaaaaa;">a</div>
        <div style="background-color: #bbbbbb;">b</div>
        <div style="background-color: #cccccc;">c</div>
        <div style="background-color: #dddddd;">d</div>
        <div style="background-color: #eeeeee;">e</div>
      `;

      const result = getPageColors(root);
      expect(result.surface).toEqual([
        'rgb(170, 170, 170)',
        'rgb(187, 187, 187)',
        'rgb(204, 204, 204)',
        'rgb(221, 221, 221)',
      ]);
      expect(result.total).toEqual(5);
    });
  });
});
