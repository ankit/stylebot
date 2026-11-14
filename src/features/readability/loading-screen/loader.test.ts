export {};

jest.mock('@stylebot/settings', () => ({
  getReadabilitySettings: jest.fn(() => new Promise(() => undefined)),
}));

describe('loader', () => {
  let showLoader: typeof import('./loader').showLoader;
  let hideLoader: typeof import('./loader').hideLoader;

  beforeEach(() => {
    jest.resetModules();
    document.documentElement.removeAttribute('style');
    ({ showLoader, hideLoader } = require('./loader'));
  });

  it("leaves the page's inline background alone when it never showed", () => {
    document.documentElement.style.background = 'rgb(17, 17, 17)';

    hideLoader();

    expect(document.documentElement.style.backgroundColor).toBe(
      'rgb(17, 17, 17)'
    );
  });

  it("puts the page's inline background back after showing", () => {
    document.documentElement.style.setProperty(
      'background-color',
      'rgb(17, 17, 17)',
      'important'
    );

    showLoader();

    expect(document.documentElement.style.backgroundColor).not.toBe(
      'rgb(17, 17, 17)'
    );

    hideLoader();

    expect(document.documentElement.style.backgroundColor).toBe(
      'rgb(17, 17, 17)'
    );
    expect(
      document.documentElement.style.getPropertyPriority('background-color')
    ).toBe('important');
    expect(document.getElementById('stylebot-reader-loading')).toBeNull();
  });

  it('drops its own background when the page had none', () => {
    showLoader();
    hideLoader();

    expect(document.documentElement.getAttribute('style')).toBe('');
  });
});
