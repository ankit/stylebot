export {};

jest.mock('../../eligibility/has-readerable-content');
jest.mock('../get-domain-url-and-source');
jest.mock('../get-readability-article');
jest.mock('../document-cache');
jest.mock('../../components/App.vue', () => ({}));

describe('mountReader()', () => {
  let hasReaderableContentModule: typeof import('../../eligibility/has-readerable-content');
  let getReadabilityArticleModule: typeof import('../get-readability-article');
  let getDomainUrlAndSourceModule: typeof import('../get-domain-url-and-source');
  let mountReaderModule: typeof import('../mount-reader');

  beforeEach(() => {
    jest.resetModules();

    hasReaderableContentModule = require('../../eligibility/has-readerable-content');
    getReadabilityArticleModule = require('../get-readability-article');
    getDomainUrlAndSourceModule = require('../get-domain-url-and-source');

    (
      getDomainUrlAndSourceModule.getDomainUrlAndSource as jest.Mock
    ).mockReturnValue({ url: 'example.com', source: 'basic' });

    mountReaderModule = require('../mount-reader');
  });

  it('rejects when the page has no readerable content', async () => {
    (
      hasReaderableContentModule.hasReaderableContent as jest.Mock
    ).mockReturnValue(false);

    await expect(mountReaderModule.mountReader()).rejects.toBeUndefined();
  });

  it('rejects when parsing the article fails', async () => {
    (
      hasReaderableContentModule.hasReaderableContent as jest.Mock
    ).mockReturnValue(true);
    (
      getReadabilityArticleModule.getReadabilityArticle as jest.Mock
    ).mockRejectedValue(new Error('unparseable'));

    await expect(mountReaderModule.mountReader()).rejects.toBeUndefined();
  });

  // Regression: the body used to run inside `new Promise(async ...)`, so a throw
  // from the eligibility check left the returned promise pending forever and
  // applyReadability()'s retry loop never advanced.
  it('rejects rather than hanging when the eligibility check throws', async () => {
    (
      hasReaderableContentModule.hasReaderableContent as jest.Mock
    ).mockImplementation(() => {
      throw new Error('boom');
    });

    await expect(mountReaderModule.mountReader()).rejects.toThrow('boom');
  });
});
