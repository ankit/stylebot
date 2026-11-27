import { supportsEditorWindow } from './editor-window-support';

describe('supportsEditorWindow', () => {
  afterEach(() => {
    delete (global as { chrome?: unknown }).chrome;
  });

  it('is true where the browser can create windows', () => {
    global.chrome = {
      windows: { create: jest.fn() },
    } as unknown as typeof chrome;
    expect(supportsEditorWindow()).toBe(true);
  });

  it('is false in Safari on iPad, which has no windows.create', () => {
    global.chrome = { windows: {} } as unknown as typeof chrome;
    expect(supportsEditorWindow()).toBe(false);
  });

  it('is false in a content script, which has no chrome.windows', () => {
    global.chrome = {} as unknown as typeof chrome;
    expect(supportsEditorWindow()).toBe(false);
  });
});
