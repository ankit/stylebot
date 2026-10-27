import { SCHEME_ATTRIBUTE, setSchemeAttribute } from './scheme-attribute';

const root = document.documentElement;

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
