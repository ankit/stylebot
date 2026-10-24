import { getGalleryByline } from './byline';

jest.mock('@stylebot/i18n', () => ({
  t: (key: string, [value]: Array<string> = []) =>
    ({
      by_author: `by ${value}`,
      installs_one: `${value} install`,
      installs_other: `${value} installs`,
    }[key]),
}));

const author = { id: 'u1', username: 'maya' };

describe('getGalleryByline', () => {
  it('names the author, with the installs once anyone has installed it', () => {
    expect(getGalleryByline({ author, installs: 0 })).toBe('by maya');
    expect(getGalleryByline({ author, installs: 1 })).toBe(
      'by maya · 1 install'
    );
    expect(getGalleryByline({ author, installs: 1240 })).toBe(
      `by maya · ${(1240).toLocaleString()} installs`
    );
  });
});
