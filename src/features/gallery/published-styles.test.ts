import { mockStorage } from './gallery.fixtures';
import {
  forgetPublishedStyle,
  getPublishedProfile,
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

  it('finds the profile a style was published from, by any account', async () => {
    await rememberPublishedStyle('github.com', 'p1', {
      styleId: 'abc',
      accountId: 'someone',
      cssHash: 'abc123',
      version: 1,
      group: 'github.com',
      slug: 'night',
    });

    expect(await getPublishedProfile('abc')).toEqual({
      url: 'github.com',
      profileId: 'p1',
    });
    expect(await getPublishedProfile('other')).toBeNull();
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
