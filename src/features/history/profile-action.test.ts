import type { StyleWithoutUrl } from '@stylebot/types';

import { getProfileAction } from './profile-action';

const style = (
  active: string,
  profiles: Record<string, { name: string; css: string }>
): StyleWithoutUrl => ({
  css: profiles[active].css,
  enabled: true,
  readability: false,
  modifiedTime: '2026-10-09T12:00:00.000Z',
  activeProfile: active,
  profiles: Object.fromEntries(
    Object.entries(profiles).map(([id, { name, css }]) => [
      id,
      id === active ? { name } : { name, css },
    ])
  ),
});

const base = {
  default: { name: '', css: 'a { color: red; }' },
  night: { name: 'Night', css: 'html { background: #000; }' },
};

describe('getProfileAction', () => {
  it('reads a new profile as added', () => {
    expect(
      getProfileAction(
        style('default', { default: base.default }),
        style('night', base)
      )
    ).toEqual({ kind: 'added', id: 'night', name: 'Night' });
  });

  it('reads a removed profile as deleted', () => {
    expect(
      getProfileAction(
        style('night', base),
        style('default', { default: base.default })
      )
    ).toEqual({ kind: 'deleted', id: 'night', name: 'Night' });
  });

  it('reads a new name as a rename', () => {
    expect(
      getProfileAction(
        style('night', base),
        style('night', { ...base, night: { ...base.night, name: 'Dark' } })
      )
    ).toEqual({ kind: 'renamed', from: 'Night', to: 'Dark' });
  });

  it('reads another active profile as a switch', () => {
    expect(
      getProfileAction(style('default', base), style('night', base))
    ).toEqual({ kind: 'switched', from: '', to: 'Night' });
  });

  it('leaves a change that also edited css as an ordinary change', () => {
    expect(
      getProfileAction(
        style('night', base),
        style('night', {
          ...base,
          night: { name: 'Dark', css: 'html { background: #111; }' },
        })
      )
    ).toBeNull();
  });

  it('leaves a new or deleted style alone', () => {
    expect(getProfileAction(null, style('default', base))).toBeNull();
    expect(getProfileAction(style('default', base), null)).toBeNull();
  });
});
