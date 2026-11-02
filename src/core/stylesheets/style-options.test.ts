import {
  SCHEME_ATTRIBUTE,
  setSchemeAttribute,
  setStyleOptions,
} from './style-options';

const root = document.documentElement;

const variables = (): string =>
  document.getElementById('stylebot-css-:options')?.textContent ?? '';

describe('setStyleOptions', () => {
  afterEach(() => {
    setStyleOptions(undefined);
  });

  it('sets each option on <html> and as a variable on :root', () => {
    setStyleOptions({
      accentColor: { value: 'mauve', css: '#cba6f7' },
      rounded: { value: '1', css: '1' },
    });

    expect(root.getAttribute('data-stylebot-accentcolor')).toBe('mauve');
    expect(root.getAttribute('data-stylebot-rounded')).toBe('1');
    expect(variables()).toBe(
      ':root:root { --accentColor: #cba6f7; --rounded: 1; }'
    );
  });

  it('removes options no longer declared, and leaves other attributes', () => {
    root.setAttribute('data-stylebot-bridge', '1');
    setStyleOptions({ rounded: { value: '1', css: '1' } });
    setStyleOptions({ accent: { value: 'blue', css: 'blue' } });

    expect(root.hasAttribute('data-stylebot-rounded')).toBe(false);
    expect(root.getAttribute('data-stylebot-accent')).toBe('blue');
    expect(variables()).toBe(':root:root { --accent: blue; }');

    setStyleOptions(undefined);

    expect(root.hasAttribute('data-stylebot-accent')).toBe(false);
    expect(root.getAttribute('data-stylebot-bridge')).toBe('1');
    expect(variables()).toBe('');
    root.removeAttribute('data-stylebot-bridge');
  });
});

describe('setSchemeAttribute', () => {
  afterEach(() => {
    setSchemeAttribute(undefined);
  });

  it('sets the attribute on <html>', () => {
    setSchemeAttribute('dark');

    expect(root.getAttribute(SCHEME_ATTRIBUTE)).toBe('dark');
  });

  it('updates it to a new scheme', () => {
    setSchemeAttribute('dark');
    setSchemeAttribute('light');

    expect(root.getAttribute(SCHEME_ATTRIBUTE)).toBe('light');
  });

  it('removes it when no scheme is wanted', () => {
    setSchemeAttribute('system');
    setSchemeAttribute(undefined);

    expect(root.hasAttribute(SCHEME_ATTRIBUTE)).toBe(false);
  });
});
