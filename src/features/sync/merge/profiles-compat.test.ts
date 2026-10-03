import type { StyleMap, StyleWithoutUrl } from '@stylebot/types';
import {
  addProfile,
  isEquivalentStyleMap,
  normalizeProfiles,
  sanitizeStyleMap,
} from '@stylebot/saved-styles';

import { mergeThreeWay } from './three-way';
import { mergeWithoutBase } from './merge-without-base';

const AT = '2026-09-26T00:00:00.000Z';
const T1 = '2024-01-01T00:00:00.000Z';
const T2 = '2024-02-01T00:00:00.000Z';
const T3 = '2024-03-01T00:00:00.000Z';

const style = (
  css: string,
  modifiedTime = T1,
  rest: Partial<StyleWithoutUrl> = {}
): StyleWithoutUrl => ({
  css,
  enabled: true,
  readability: false,
  modifiedTime,
  ...rest,
});

/**
 * What Stylebot 3.2.4 stores when it saves a style: only the fields it
 * knows, so any profiles are gone.
 */
const legacySave = (css: string, modifiedTime: string): StyleWithoutUrl => ({
  css,
  readability: false,
  enabled: true,
  modifiedTime,
});

const hasProfileFields = (styles: StyleMap) =>
  Object.values(styles).some(s => 'profiles' in s || 'activeProfile' in s);

describe('styles without profiles', () => {
  const legacy: StyleMap = {
    'a.com': style('a { color: red; }'),
    'b.com': style('b {}', T1, { enabled: false, forceImportant: false }),
    '*': style('* { font-family: serif; }', T1, { readability: true }),
  };

  it('are left exactly as stored by sanitizing and normalizing', () => {
    expect(sanitizeStyleMap(legacy)).toEqual(legacy);
    expect(hasProfileFields(sanitizeStyleMap(legacy))).toBe(false);

    for (const s of Object.values(legacy)) {
      expect(normalizeProfiles(s)).toBe(s);
    }
  });

  it('never gain profile fields from a merge', () => {
    const local = { ...legacy, 'a.com': style('a { color: blue; }', T2) };
    const remote = {
      ...legacy,
      'a.com': style('a { color: red; }\nb { margin: 0; }', T3),
      'c.com': style('c {}', T2),
    };

    for (const styles of [
      mergeThreeWay(legacy, local, remote, AT).styles,
      mergeThreeWay(legacy, legacy, remote, AT).styles,
      mergeWithoutBase(local, remote),
    ]) {
      expect(hasProfileFields(styles)).toBe(false);
    }
  });

  it('read as unchanged against a copy with a lone default profile', () => {
    const materialized = {
      'a.com': {
        ...legacy['a.com'],
        profiles: { default: { name: '' } },
        activeProfile: 'default',
      },
    };

    expect(
      isEquivalentStyleMap({ 'a.com': legacy['a.com'] }, materialized)
    ).toBe(true);
  });
});

describe('a device still on 3.2.4', () => {
  const withProfiles = addProfile(style('a { color: red; }', T2), {
    id: 'dark',
    name: 'Dark',
    css: 'a { color: white; }',
    activate: false,
  });

  it('saving a style keeps the profiles it did not know about', () => {
    const base = { 'a.com': withProfiles };
    const remote = { 'a.com': legacySave('a { color: pink; }', T3) };

    const { styles } = mergeThreeWay(base, base, remote, AT);

    expect(styles['a.com']).toMatchObject({
      css: 'a { color: pink; }',
      activeProfile: 'default',
      profiles: { dark: { name: 'Dark', css: 'a { color: white; }' } },
    });
  });

  it('writing back a copy from before a profile was made keeps that profile', () => {
    const before = { 'a.com': style('a { color: red; }', T1) };
    const now = { 'a.com': withProfiles };

    const { styles } = mergeThreeWay(now, now, before, AT);

    expect(styles['a.com'].profiles?.dark).toEqual({
      name: 'Dark',
      css: 'a { color: white; }',
    });
  });

  it('a first sync against its file keeps profiles from either side', () => {
    const merged = mergeWithoutBase(
      { 'a.com': withProfiles },
      { 'a.com': legacySave('a { color: pink; }', T3) }
    );

    expect(merged['a.com'].profiles?.dark).toEqual({
      name: 'Dark',
      css: 'a { color: white; }',
    });
  });
});
