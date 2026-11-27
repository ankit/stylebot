import { supportsEditorWindow } from './editor-window-support';

describe('supportsEditorWindow', () => {
  afterEach(() => {
    delete (global as { chrome?: unknown }).chrome;
  });

  it.each([
    { context: 'Chrome', windows: { create: jest.fn() }, expected: true },
    { context: 'Safari on iPad', windows: {}, expected: false },
    { context: 'a content script', windows: undefined, expected: false },
  ])('is $expected in $context', ({ windows, expected }) => {
    global.chrome = { windows } as unknown as typeof chrome;
    expect(supportsEditorWindow()).toBe(expected);
  });
});
