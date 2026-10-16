import { supportsEditorSidePanel } from './editor-panel';

const makeChrome = ({ sidePanel = false, optional = ['sidePanel'] } = {}) => {
  global.chrome = {
    runtime: { getManifest: () => ({ optional_permissions: optional }) },
    sidePanel: sidePanel ? { open: jest.fn() } : undefined,
  } as unknown as typeof chrome;
};

describe('supportsEditorSidePanel', () => {
  it('says yes before the permission is granted, when it can be', () => {
    makeChrome();

    expect(supportsEditorSidePanel()).toBe(true);
  });

  it('says yes with the permission', () => {
    makeChrome({ sidePanel: true, optional: [] });

    expect(supportsEditorSidePanel()).toBe(true);
  });

  it('says no in a build that can’t ask for it', () => {
    makeChrome({ optional: [] });

    expect(supportsEditorSidePanel()).toBe(false);
  });
});
