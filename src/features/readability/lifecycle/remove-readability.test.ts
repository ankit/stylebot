export {};

jest.mock('../loading-screen/loader');
jest.mock('./document-cache');
jest.mock('./state');

describe('removeReadability()', () => {
  let loaderModule: typeof import('../loading-screen/loader');
  let documentCacheModule: typeof import('./document-cache');
  let stateModule: typeof import('./state');
  let removeReadability: typeof import('./remove-readability').removeReadability;

  beforeEach(() => {
    jest.resetModules();
    jest.useFakeTimers();

    document.body.innerHTML = '';

    loaderModule = require('../loading-screen/loader');
    documentCacheModule = require('./document-cache');
    stateModule = require('./state');

    ({ removeReadability } = require('./remove-readability'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('hides the loader, restores the page, and invalidates the current generation', () => {
    removeReadability();

    expect(loaderModule.hideLoader).toBeCalledTimes(1);
    expect(documentCacheModule.revertToCachedDocument).toBeCalledTimes(1);
    expect(stateModule.nextGeneration).toBeCalledTimes(1);
    expect(stateModule.clearPendingRetry).toBeCalledTimes(1);
  });

  it('removes the host immediately when it has no panel', () => {
    const host = document.createElement('div');
    host.id = 'stylebot-reader';
    host.attachShadow({ mode: 'open' });
    document.body.appendChild(host);

    removeReadability();

    expect(document.getElementById('stylebot-reader')).toBeNull();
  });

  it('fades the panel out before removing the host', () => {
    const host = document.createElement('div');
    host.id = 'stylebot-reader';
    const shadowRoot = host.attachShadow({ mode: 'open' });
    const panel = document.createElement('div');
    panel.className = 'stylebot-reader';
    shadowRoot.appendChild(panel);
    document.body.appendChild(host);

    removeReadability();

    expect(panel.classList.contains('closing')).toBe(true);
    expect(document.getElementById('stylebot-reader')).not.toBeNull();

    jest.runOnlyPendingTimers();

    expect(document.getElementById('stylebot-reader')).toBeNull();
  });
});
