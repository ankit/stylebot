import { isForceImportantCss, setForceImportantCss } from './force-important';

const RULE = 'a { color: red; }';

describe('isForceImportantCss', () => {
  it('is true without the key, and follows it in either block', () => {
    expect(isForceImportantCss(RULE)).toBe(true);
    expect(
      isForceImportantCss(
        `/* ==Stylebot==\n@force-important false\n==/Stylebot== */\n${RULE}`
      )
    ).toBe(false);
    expect(
      isForceImportantCss(
        `/**\n * ==UserStyle==\n * @force-important false\n * ==/UserStyle==\n */\n${RULE}`
      )
    ).toBe(false);
  });

  it('ignores the key outside a block, or with a value other than true or false', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    expect(isForceImportantCss(`/* @force-important false */ ${RULE}`)).toBe(
      true
    );
    expect(
      isForceImportantCss(
        `/* ==Stylebot==\n@force-important no\n==/Stylebot== */\n${RULE}`
      )
    ).toBe(true);
    expect(warn).toHaveBeenCalledTimes(1);

    warn.mockRestore();
  });
});

describe('setForceImportantCss', () => {
  it('adds a block at the top when turned off, and removes it again when on', () => {
    const off = setForceImportantCss(RULE, false);

    expect(off).toBe(
      `/* ==Stylebot==\n@force-important false\n==/Stylebot== */\n\n${RULE}`
    );
    expect(isForceImportantCss(off)).toBe(false);
    expect(setForceImportantCss(off, true)).toBe(RULE);
  });

  it('writes into an existing block in its own style, and leaves the rest of it when on', () => {
    const css = `/**\n * ==Stylebot==\n * @modes light, dark\n * ==/Stylebot==\n */\n${RULE}`;
    const off = setForceImportantCss(css, false);

    expect(off).toBe(
      `/**\n * ==Stylebot==\n * @force-important false\n * @modes light, dark\n * ==/Stylebot==\n */\n${RULE}`
    );
    expect(setForceImportantCss(off, true)).toBe(css);
  });

  it('leaves css alone when nothing changes, and never writes the key twice', () => {
    const off = setForceImportantCss(RULE, false);

    expect(setForceImportantCss(RULE, true)).toBe(RULE);
    expect(setForceImportantCss(off, false)).toBe(off);
  });
});
