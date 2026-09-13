import { ensureEditorInjected } from './ensure-editor-injected';

describe('ensureEditorInjected', () => {
  it('injects editor/index.js into the given tab', async () => {
    global.chrome = {
      scripting: { executeScript: jest.fn().mockResolvedValue(undefined) },
    } as unknown as typeof chrome;

    await ensureEditorInjected(42);

    expect(chrome.scripting.executeScript).toBeCalledWith({
      target: { tabId: 42 },
      files: ['editor/index.js'],
    });
  });

  it('no-ops when chrome.scripting is unavailable (Firefox)', async () => {
    global.chrome = {} as unknown as typeof chrome;

    await expect(ensureEditorInjected(42)).resolves.toBeUndefined();
  });

  it('swallows a rejected injection (closed tab, unscriptable page, etc.)', async () => {
    global.chrome = {
      scripting: {
        executeScript: jest.fn().mockRejectedValue(new Error('no such tab')),
      },
    } as unknown as typeof chrome;

    await expect(ensureEditorInjected(42)).resolves.toBeUndefined();
  });
});
