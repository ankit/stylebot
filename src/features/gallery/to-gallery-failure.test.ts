import { galleryApiError } from './request';
import { toGalleryFailure } from './to-gallery-failure';

describe('toGalleryFailure', () => {
  it.each([
    [0, 'gallery_error_network'],
    [400, 'gallery_error_invalid'],
    [401, 'gallery_error_sign_in'],
    [409, 'gallery_error_conflict'],
    [413, 'gallery_error_screenshot_too_large'],
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

  it('reports other errors as a failed sign-in', () => {
    expect(toGalleryFailure(new Error('Sign-in window closed')).errorKey).toBe(
      'gallery_error_sign_in'
    );
  });
});
