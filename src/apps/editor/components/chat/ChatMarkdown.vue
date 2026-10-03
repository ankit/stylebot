<template>
  <div class="chat-markdown">
    <template v-for="(block, index) in blocks">
      <p
        v-if="block.type === 'paragraph'"
        :key="index"
        class="markdown-paragraph"
      >
        <template v-for="(line, lineIndex) in block.lines">
          <br v-if="lineIndex" :key="`br-${lineIndex}`" />
          <chat-markdown-line
            :key="lineIndex"
            :line="line"
            :tail="lineIndex === block.lines.length - 1 ? tailOf(index) : []"
          />
        </template>
      </p>

      <p
        v-else-if="block.type === 'heading'"
        :key="index"
        class="markdown-heading"
      >
        <chat-markdown-line :line="block.line" :tail="tailOf(index)" />
      </p>

      <component
        :is="block.ordered ? 'ol' : 'ul'"
        v-else-if="block.type === 'list'"
        :key="index"
        class="markdown-list"
        :start="block.start !== 1 ? block.start : undefined"
      >
        <li v-for="(item, itemIndex) in block.items" :key="itemIndex">
          <chat-markdown-line
            :line="item"
            :tail="itemIndex === block.items.length - 1 ? tailOf(index) : []"
          />
        </li>
      </component>

      <pre v-else :key="index" class="markdown-code-block"><chat-markdown-line
        :line="[{ type: 'text', text: block.text }]"
        :tail="tailOf(index)"
      /></pre>
    </template>

    <p v-if="!blocks.length" class="markdown-paragraph">
      <chat-markdown-line :line="[]" :tail="tailOf(-1)" />
    </p>
  </div>
</template>

<script lang="ts">
import type { VNode } from 'vue';
import Vue from 'vue';

import { parseMarkdown } from '@stylebot/chat';
import type { MarkdownBlock } from '@stylebot/chat';

import ChatMarkdownLine from './ChatMarkdownLine.vue';

/**
 * A reply's markdown, built as elements rather than HTML so nothing in the
 * text can reach the page as markup. Slot content trails the last block,
 * e.g. the streaming caret.
 */
export default Vue.extend({
  name: 'ChatMarkdown',

  components: {
    ChatMarkdownLine,
  },

  props: {
    text: {
      type: String,
      required: true,
    },
  },

  computed: {
    blocks(): Array<MarkdownBlock> {
      return parseMarkdown(this.text);
    },

    lastIndex(): number {
      return this.blocks.length - 1;
    },
  },

  methods: {
    /**
     * The slot content, for the last block only, where it trails the text.
     */
    tailOf(index: number): Array<VNode> {
      return index === this.lastIndex ? this.$slots.default ?? [] : [];
    },
  },
});
</script>

<style lang="scss" scoped>
.chat-markdown {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
  font-family: var(--font-reading);
  font-size: 14px;
  font-weight: 350;
  line-height: 1.6;
  letter-spacing: 0.01em;
  color: var(--reading-ink);
  overflow-wrap: anywhere;
  text-wrap: pretty;

  @include dark-mode {
    -webkit-font-smoothing: antialiased;
  }
}

.markdown-paragraph,
.markdown-heading,
.markdown-list,
.markdown-list li {
  font-family: inherit;
}

.markdown-paragraph,
.markdown-heading {
  margin: 0;
}

.markdown-heading {
  font-weight: 500;
  color: var(--reading-strong);
}

.markdown-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 0;
  padding-left: 22px;

  ::marker {
    color: var(--text-muted);
  }
}

.markdown-code-block {
  margin: 0;
  padding: 8px 10px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--text-primary) 5%, var(--tab-surface));
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 1.5;
  overflow-x: auto;
  overflow-wrap: normal;

  @include thin-scrollbar;
}
</style>
