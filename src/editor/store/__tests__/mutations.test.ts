import * as postcss from 'postcss';
import mutations from '../mutations';
import mockState from '../__mocks__/state';

describe('mutations', () => {
  describe('setSelectors', () => {
    it('selectors sorted by number of matching DOM elements', () => {
      document.body
        .appendChild(document.createElement('a'))
        .appendChild(document.createElement('a'))
        .appendChild(document.createElement('b'))
        .appendChild(document.createElement('c'))
        .appendChild(document.createElement('c'))
        .appendChild(document.createElement('c'));

      const root = postcss.parse('b { color: red; } a { color: green; } c { }');

      const state = { ...mockState };

      mutations.setSelectors(state, root);

      expect(state.selectors).toEqual([
        { id: 3, value: 'c', count: 3 },
        { id: 2, value: 'a', count: 2 },
        { id: 1, value: 'b', count: 1 },
      ]);
    });

    it('selectors sorted alphabetically when DOM elements count is the same', () => {
      document.body.innerHTML = '';

      const root = postcss.parse('b { color: red; } a { color: green; } c { }');
      const state = { ...mockState };

      mutations.setSelectors(state, root);

      expect(state.selectors).toEqual([
        { id: 2, value: 'a', count: 0 },
        { id: 1, value: 'b', count: 0 },
        { id: 3, value: 'c', count: 0 },
      ]);
    });
  });

  describe('setAiGenerating', () => {
    it('sets the aiGenerating flag', () => {
      const state = { ...mockState };
      mutations.setAiGenerating(state, true);
      expect(state.aiGenerating).toBe(true);
    });
  });

  describe('pushChatMessage', () => {
    it('appends a message to the chat history', () => {
      const state = { ...mockState, chatMessages: [] };

      mutations.pushChatMessage(state, { role: 'user', text: 'make links red' });
      mutations.pushChatMessage(state, {
        role: 'assistant',
        status: 'success',
        message: 'Made links red.',
        css: 'a { color: red; }',
      });

      expect(state.chatMessages).toEqual([
        { role: 'user', text: 'make links red' },
        {
          role: 'assistant',
          status: 'success',
          message: 'Made links red.',
          css: 'a { color: red; }',
        },
      ]);
    });
  });

  describe('appendApiHistory', () => {
    it('appends a turn to the api conversation history', () => {
      const state = { ...mockState, apiHistory: [] };

      mutations.appendApiHistory(state, { role: 'user', content: 'hello' });
      mutations.appendApiHistory(state, { role: 'assistant', content: 'hi' });

      expect(state.apiHistory).toEqual([
        { role: 'user', content: 'hello' },
        { role: 'assistant', content: 'hi' },
      ]);
    });
  });

  describe('setLastSentDom', () => {
    it('sets the last sent dom snapshot', () => {
      const state = { ...mockState };
      mutations.setLastSentDom(state, 'body\n  a');
      expect(state.lastSentDom).toBe('body\n  a');
    });
  });
});
