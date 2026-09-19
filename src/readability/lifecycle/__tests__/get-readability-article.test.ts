export {};

jest.mock('defuddle', () => ({
  __esModule: true,
  default: jest.fn(),
}));

/*
 * A synchronous spin can't be interrupted by Jest's timer, so these bounds only
 * fail fast once the scan terminates — CI job timeouts remain the backstop.
 */
const TERMINATION_TIMEOUT_MS = 5000;

describe('getReadabilityArticle()', () => {
  let defuddleModule: typeof import('defuddle');
  let getReadabilityArticle: typeof import('../get-readability-article').getReadabilityArticle;

  const mockArticle = (content: string, image: string) => {
    (defuddleModule.default as unknown as jest.Mock).mockImplementation(() => ({
      parse: () => ({
        title: 'Title',
        author: 'Author',
        site: 'Example',
        published: '',
        description: '',
        content,
        image,
      }),
    }));
  };

  const countLeadFigures = (content: string) =>
    (content.match(/<figure>/g) || []).length;

  const bodyWithImage = (src: string) => `<p>Body</p><img src="${src}">`;

  beforeEach(() => {
    jest.resetModules();

    document.body.innerHTML = '';

    defuddleModule = require('defuddle');

    ({ getReadabilityArticle } = require('../get-readability-article'));
  });

  it(
    'should not prepend a duplicate figure when the hero image url is identical to one in the body',
    async () => {
      const url = 'https://example.com/uploads/2024/05/photo.jpg';
      mockArticle(bodyWithImage(url), url);

      const article = await getReadabilityArticle();

      expect(countLeadFigures(article.content)).toBe(0);
    },
    TERMINATION_TIMEOUT_MS
  );

  it(
    'should treat the same photo as a duplicate when the hero image url carries a query string',
    async () => {
      mockArticle(
        bodyWithImage('https://example.com/uploads/2024/05/photo.jpg'),
        'https://example.com/uploads/2024/05/photo.jpg?w=800'
      );

      const article = await getReadabilityArticle();

      expect(countLeadFigures(article.content)).toBe(0);
    },
    TERMINATION_TIMEOUT_MS
  );

  it('should treat a resized variant sharing a filename prefix as the same image', async () => {
    mockArticle(
      bodyWithImage('https://example.com/uploads/2024/05/photo-1024.jpg'),
      'https://example.com/uploads/2024/05/photo.jpg'
    );

    const article = await getReadabilityArticle();

    expect(countLeadFigures(article.content)).toBe(0);
  });

  it('should prepend the hero image when the body image lives in a different directory', async () => {
    const heroUrl = 'https://example.com/uploads/2024/06/photo.jpg';
    mockArticle(
      bodyWithImage('https://example.com/uploads/2024/05/photo.jpg'),
      heroUrl
    );

    const article = await getReadabilityArticle();

    expect(countLeadFigures(article.content)).toBe(1);
    expect(article.content).toContain(`<img src="${heroUrl}">`);
  });

  it(
    'should compare extension-only filenames without scanning past the end of the stem',
    async () => {
      const url = 'https://example.com/uploads/2024/05/.jpg';
      mockArticle(bodyWithImage(url), url);

      const article = await getReadabilityArticle();

      expect(countLeadFigures(article.content)).toBe(0);
    },
    TERMINATION_TIMEOUT_MS
  );
});
