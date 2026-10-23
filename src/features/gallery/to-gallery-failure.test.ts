import { galleryApiError } from './request';
import { toGalleryFailure } from './to-gallery-failure';

describe('toGalleryFailure', () => {
  it.each([
    [0, 'gallery_error_network'],
    [400, 'gallery_error_invalid'],
    [404, 'gallery_error_not_found'],
    [500, 'gallery_error_unknown'],
  ])('maps status %i to %s', (status, errorKey) => {
    expect(toGalleryFailure(galleryApiError('message', status))).toEqual({
      ok: false,
      errorKey,
      errorDetail: 'message',
    });
  });

  it("reports sync's network errors as network errors", () => {
    const error = Object.assign(new Error('offline'), { code: 'network' });
    expect(toGalleryFailure(error).errorKey).toBe('gallery_error_network');
  });

  it('reports other errors as unknown', () => {
    expect(toGalleryFailure(new Error('Tab closed')).errorKey).toBe(
      'gallery_error_unknown'
    );
  });
});
