import { getGalleryEditUrl, getGalleryStyleUrl } from './config';
import { getGalleryMenuItem } from './menu-item';
import { hashCss } from './utils';

const published = {
  styleId: 1,
  version: 1,
  cssHash: hashCss('h1 { color: red; }'),
  slug: 'red',
};

describe('getGalleryMenuItem', () => {
  it('offers to publish a profile that never was', () => {
    expect(
      getGalleryMenuItem({ published: null, installed: null }, 'h1 {}')
    ).toEqual({ label: 'publish_to_gallery', changed: false });
  });

  it('offers an update once the published css changes, and to edit it on the gallery site until then', () => {
    expect(
      getGalleryMenuItem({ published, installed: null }, 'h1 { color: blue; }')
    ).toEqual({ label: 'publish_update', changed: true });
    expect(
      getGalleryMenuItem({ published, installed: null }, 'h1 { color: red; }')
    ).toEqual({
      label: 'manage_in_gallery',
      changed: false,
      url: getGalleryEditUrl(1),
    });
  });

  it("links someone else's installed style to its Gallery page", () => {
    expect(
      getGalleryMenuItem(
        { published: null, installed: { id: 2, slug: 's', cssHash: 'abc' } },
        'h1 {}'
      )
    ).toEqual({
      label: 'view_in_gallery',
      changed: false,
      url: getGalleryStyleUrl({ id: 2, slug: 's' }),
    });
  });
});
