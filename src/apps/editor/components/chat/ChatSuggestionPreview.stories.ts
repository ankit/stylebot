import type { Meta } from '@storybook/vue';

import ChatSuggestionPreview from './ChatSuggestionPreview.vue';
import { SUGGESTION_PREVIEWS } from './suggestion-previews';
import { TERMINAL_THEMES } from '@stylebot/chat';
import { fromTemplate } from '@stylebot/storybook/story-helpers';

const meta: Meta = {
  title: 'Editor/Chat/Suggestion previews',
  component: ChatSuggestionPreview,
};

export default meta;

export const All = fromTemplate(
  { ChatSuggestionPreview },
  `
  <div style="display: grid; grid-template-columns: repeat(4, 96px); gap: 16px 12px">
    <div
      v-for="{ id, theme } in previews"
      :key="id + theme"
      style="display: flex; flex-direction: column; gap: 6px; font: 11px/1.3 var(--font-mono); color: var(--text-muted)"
    >
      <span style="height: 54px; border-radius: 7px; overflow: hidden">
        <chat-suggestion-preview :id="id" :theme="theme" />
      </span>
      {{ theme ? id + ' (' + theme + ')' : id }}
    </div>
  </div>
`,
  {
    data: () => ({
      previews: [
        ...Object.keys(SUGGESTION_PREVIEWS).map(id => ({ id, theme: '' })),
        ...TERMINAL_THEMES.map(theme => ({ id: 'terminal', theme })),
      ],
    }),
  }
);
