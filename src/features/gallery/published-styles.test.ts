import { mockStorage } from './gallery.fixtures';
import {
  forgetPublishedStyle,
  getPublishedStyleIdForProfile,
  rememberPublishedStyle,
} from './published-styles';

beforeEach(() => {
  mockStorage();
});

describe('published styles', () => {
  it("remembers the style published from a style's profile", async () => {
    await rememberPublishedStyle('github.com', 'default', {
      styleId: 'abc',
      accountId: 'me',
      cssHash: 'abc123',
      version: 1,
      group: 'github.com',
      slug: 'night',
    });

    expect(
      await getPublishedStyleIdForProfile('github.com', 'default', 'me')
    ).toBe('abc');
    expect(
      await getPublishedStyleIdForProfile('github.com', 'other', 'me')
    ).toBeNull();
  });

  it('ignores a style another account published', async () => {
    await rememberPublishedStyle('github.com', 'default', {
      styleId: 'abc',
      accountId: 'someone',
      cssHash: 'abc123',
      version: 1,
      group: 'github.com',
      slug: 'night',
    });

    expect(
      await getPublishedStyleIdForProfile('github.com', 'default', 'me')
    ).toBeNull();
  });

  it('forgets an unpublished style', async () => {
    await rememberPublishedStyle('github.com', 'default', {
      styleId: 'abc',
      accountId: 'me',
      cssHash: 'abc123',
      version: 1,
      group: 'github.com',
      slug: 'night',
    });
    await forgetPublishedStyle('abc');

    expect(
      await getPublishedStyleIdForProfile('github.com', 'default', 'me')
    ).toBeNull();
  });
});
