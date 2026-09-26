import { getCssVariables } from '../css-variables';
import { getPageCssContext } from '../page-css';

// jsdom doesn't list custom properties; tests say what the page defines.
jest.mock('../css-variables', () => ({ getCssVariables: jest.fn(() => []) }));

const setPage = (css: string, body: string) => {
  document.head.innerHTML = `<style>${css}</style>`;
  document.body.innerHTML = body;
};

describe('getPageCssContext', () => {
  it('lists every rule matching the picked element, and nothing else', () => {
    setPage(
      `.title { font-size: 20px; }
       h1.title { color: var(--fg); }
       @media (min-width: 1px) { .title { margin: 0; } }
       .comment { color: red; }`,
      '<h1 class="title">Hi</h1><p class="comment">x</p>'
    );

    expect(getPageCssContext('.title')).toBe(
      [
        '/* Rules matching the picked element */',
        '.title { font-size: 20px }',
        'h1.title { color: var(--fg) }',
        '@media (min-width: 1px) { .title { margin: 0 } }',
      ].join('\n')
    );
  });

  it('reads no rules when nothing is picked', () => {
    setPage('.a { color: red; }', '<div class="a"></div>');

    expect(getPageCssContext('')).toBe('');
  });

  it('skips Stylebot’s own stylesheets', () => {
    document.head.innerHTML =
      '<style id="stylebot-css-1">.mine { color: red; }</style>';
    document.body.innerHTML = '<p class="mine">x</p>';

    expect(getPageCssContext('.mine')).toBe('');
  });

  it('starts with the variables, as the rules that would override them', () => {
    jest.mocked(getCssVariables).mockReturnValueOnce([
      { name: '--bg', value: '#fff', on: 'html' },
      { name: '--fg', value: '#111', on: 'html' },
      { name: '--text', value: 'rgb(1, 2, 3)', on: 'body' },
    ]);
    setPage('.a { color: var(--fg); }', '<div class="a"></div>');

    expect(getPageCssContext('.a')).toBe(
      [
        '/* Variables */',
        ':root { --bg: #fff; --fg: #111 }',
        'body { --text: rgb(1, 2, 3) }',
        '',
        '/* Rules matching the picked element */',
        '.a { color: var(--fg) }',
      ].join('\n')
    );
  });
});
