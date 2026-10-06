import type { StyleWithoutUrl } from '@stylebot/types';

import {
  BACKUP_FORMAT,
  BACKUP_VERSION,
  createBackup,
  mergeBackup,
  parseBackup,
  previewImport,
} from './backup';

const style = (rest: Partial<StyleWithoutUrl> = {}): StyleWithoutUrl => ({
  css: 'a { color: red; }',
  enabled: true,
  readability: false,
  modifiedTime: '2026-01-01T00:00:00.000Z',
  ...rest,
});

describe('parseBackup', () => {
  it('reads a backup it exported', () => {
    const styles = { 'example.com': style() };
    const text = JSON.stringify(createBackup(styles, '2026-10-06T00:00:00Z'));

    expect(parseBackup(text)).toEqual({ ok: true, styles });
  });

  it('reads the bare style map earlier versions exported', () => {
    const styles = { 'example.com': style() };

    expect(parseBackup(JSON.stringify(styles))).toEqual({ ok: true, styles });
  });

  it('rejects text that is not JSON', () => {
    expect(parseBackup('{ nope')).toEqual({
      ok: false,
      errorKey: 'import_error_not_json',
    });
  });

  it.each([
    ['an array', []],
    ['a string', 'styles'],
    ['a map with a style missing css', { 'example.com': { enabled: true } }],
    [
      'an envelope without a version',
      { format: BACKUP_FORMAT, styles: { 'example.com': style() } },
    ],
    [
      'an envelope without styles',
      { format: BACKUP_FORMAT, version: BACKUP_VERSION },
    ],
  ])('rejects %s as not a backup', (_name, value) => {
    expect(parseBackup(JSON.stringify(value))).toEqual({
      ok: false,
      errorKey: 'import_error_not_backup',
    });
  });

  it.each([
    ['an empty map', {}],
    ['an envelope with no styles', createBackup({}, '')],
    ['a map whose only url is blank', { ' ': style() }],
  ])('rejects %s as empty instead of wiping every style', (_name, value) => {
    expect(parseBackup(JSON.stringify(value))).toEqual({
      ok: false,
      errorKey: 'import_error_empty',
    });
  });

  it('rejects a backup from a newer format', () => {
    const text = JSON.stringify({
      ...createBackup({ 'example.com': style() }, ''),
      version: BACKUP_VERSION + 1,
    });

    expect(parseBackup(text)).toEqual({
      ok: false,
      errorKey: 'import_error_newer_version',
    });
  });

  it('fills in fields a hand-edited backup left out', () => {
    const text = JSON.stringify({ 'example.com': { css: 'a {}' } });

    expect(parseBackup(text)).toEqual({
      ok: true,
      styles: {
        'example.com': {
          css: 'a {}',
          enabled: true,
          readability: false,
          modifiedTime: '',
        },
      },
    });
  });
});

describe('previewImport', () => {
  it('counts added, changed, matching and missing urls', () => {
    const current = {
      'same.com': style(),
      'whitespace.com': style({ css: 'a { color: red; }' }),
      'changed.com': style(),
      'local-only.com': style(),
    };
    const incoming = {
      'same.com': style({ modifiedTime: '2020-01-01T00:00:00.000Z' }),
      'whitespace.com': style({ css: 'a {\n  color: red;\n}' }),
      'changed.com': style({ css: 'a { color: blue; }' }),
      'new.com': style(),
    };

    expect(previewImport(current, incoming)).toEqual({
      added: 1,
      updated: 1,
      unchanged: 2,
      notInBackup: 1,
    });
  });
});

describe('mergeBackup', () => {
  it('keeps local-only and matching styles and takes the rest from the backup', () => {
    const local = style({ modifiedTime: '2026-05-05T00:00:00.000Z' });
    const changed = style({ css: 'a { color: blue; }' });
    const current = {
      'same.com': local,
      'changed.com': style(),
      'local-only.com': style(),
    };

    const merged = mergeBackup(current, {
      'same.com': style(),
      'changed.com': changed,
      'new.com': style(),
    });

    expect(merged).toEqual({
      'same.com': local,
      'changed.com': changed,
      'local-only.com': style(),
      'new.com': style(),
    });
  });
});
