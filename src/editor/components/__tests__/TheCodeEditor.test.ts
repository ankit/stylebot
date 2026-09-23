import Vue from 'vue';
import { mount, Wrapper } from '@vue/test-utils';

import TheCodeEditor from '../TheCodeEditor.vue';

const CodeEditorIframeStub = { template: '<div><iframe /></div>' };

const buildMockStore = (css = '') => {
  const state = Vue.observable({
    css,
    activeSelector: '',
    options: { mode: 'code' },
  });

  const dispatch = jest.fn((action: string, payload?: { css: string }) => {
    if (action === 'applyCss' && payload) {
      state.css = payload.css;
    }
  });

  return { state, dispatch };
};

const type = (css: string) =>
  window.dispatchEvent(
    new MessageEvent('message', {
      data: { type: 'stylebotMonacoIframeCssUpdated', css },
    })
  );

const applyCssCalls = (store: ReturnType<typeof buildMockStore>) =>
  store.dispatch.mock.calls.filter(([action]) => action === 'applyCss');

describe('TheCodeEditor.vue', () => {
  let wrapper: Wrapper<Vue> | undefined;
  let store: ReturnType<typeof buildMockStore>;

  beforeEach(() => {
    jest.useFakeTimers();
    (global as unknown as { chrome: unknown }).chrome = {
      runtime: { getURL: (path: string) => path },
    };

    store = buildMockStore('a { color: red; }');
    wrapper = mount(TheCodeEditor, {
      mocks: { $store: store },
      stubs: { CodeEditorIframe: CodeEditorIframeStub },
      attachTo: document.body,
    });
  });

  afterEach(() => {
    wrapper?.destroy();
    wrapper = undefined;
    jest.useRealTimers();
  });

  it('applies a burst of typing once, with the last text, after typing pauses', () => {
    type('h');
    type('h1');
    type('h1 { color: blue; }');

    jest.advanceTimersByTime(199);
    expect(applyCssCalls(store)).toHaveLength(0);

    jest.advanceTimersByTime(1);
    expect(applyCssCalls(store)).toEqual([
      ['applyCss', { css: 'h1 { color: blue; }' }],
    ]);
  });

  it('does not re-apply text that matches the store, such as Monaco echoing a setValue', () => {
    type('a { color: red; }');
    jest.advanceTimersByTime(200);

    expect(applyCssCalls(store)).toHaveLength(0);
  });

  it('applies pending typing before a newly picked selector refreshes the editor from the store', async () => {
    type('a { color: blue; }');
    store.state.activeSelector = 'a';
    await Vue.nextTick();

    expect(applyCssCalls(store)[0]).toEqual([
      'applyCss',
      { css: 'a { color: blue; }' },
    ]);
  });

  it('drops pending typing when the css is replaced from outside the editor', async () => {
    type('a { color: blue; }');
    store.state.css = 'b { color: green; }';
    await Vue.nextTick();

    jest.advanceTimersByTime(200);
    expect(applyCssCalls(store)).toHaveLength(0);
    expect(store.state.css).toBe('b { color: green; }');
  });

  it('applies pending typing when the editor is torn down', () => {
    type('a { color: blue; }');
    wrapper?.destroy();
    wrapper = undefined;

    expect(applyCssCalls(store)).toEqual([
      ['applyCss', { css: 'a { color: blue; }' }],
    ]);
  });
});
