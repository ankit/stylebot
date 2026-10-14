import { isSaveShortcut } from './save-shortcut';

const keydown = (init: KeyboardEventInit) => new KeyboardEvent('keydown', init);

describe('isSaveShortcut', () => {
  it.each([
    { init: { key: 's', ctrlKey: true }, mac: false, expected: true },
    { init: { key: 'S', ctrlKey: true }, mac: false, expected: true },
    { init: { key: 's', metaKey: true }, mac: true, expected: true },
    { init: { key: 's', metaKey: true }, mac: false, expected: false },
    { init: { key: 's', ctrlKey: true }, mac: true, expected: false },
    {
      init: { key: 's', ctrlKey: true, shiftKey: true },
      mac: false,
      expected: false,
    },
    {
      init: { key: 's', ctrlKey: true, altKey: true },
      mac: false,
      expected: false,
    },
    { init: { key: 's' }, mac: false, expected: false },
    { init: { key: 'd', ctrlKey: true }, mac: false, expected: false },
  ])('$init on mac=$mac is $expected', ({ init, mac, expected }) => {
    expect(isSaveShortcut(keydown(init), mac)).toBe(expected);
  });
});
