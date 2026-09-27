<template>
  <div class="chat-change" :class="{ undone: !turn.applied }">
    <code-icon :size="14" class="chat-change-icon" />
    <s-text as="span" size="label" class="chat-change-label" :title="selectors">
      {{ summary }}
    </s-text>
    <span class="chat-change-spacer" />
    <div class="chat-change-actions">
      <s-button
        variant="ghost"
        size="small"
        :title="t('view_in_code')"
        @click="viewInCode"
      >
        {{ t('code_mode') }}
      </s-button>
      <s-button
        v-if="latest"
        variant="ghost"
        size="small"
        :disabled="busy"
        @click="toggle"
      >
        {{ turn.applied ? t('undo') : t('reapply') }}
      </s-button>
    </div>
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';

import { SButton, SText } from '@stylebot/components';
import { CodeIcon } from '@stylebot/icons';
import { countCssLines, findEditLines } from '@stylebot/chat';
import type { ChatAssistantTurn } from '@stylebot/types';

/**
 * What a reply changed on the page, with Undo / Reapply for the latest.
 */
export default Vue.extend({
  name: 'ChatChangeCard',

  components: {
    CodeIcon,
    SButton,
    SText,
  },

  props: {
    turn: {
      type: Object as PropType<ChatAssistantTurn>,
      required: true,
    },

    // Only the latest reply can be undone; later replies may build on
    // earlier ones.
    latest: {
      type: Boolean,
      default: false,
    },

    // A reply is streaming against the stylesheet as it stands, so this
    // one mustn't shift under it.
    busy: {
      type: Boolean,
      default: false,
    },
  },

  computed: {
    summary(): string {
      const lines = String(countCssLines(this.turn.edits));

      return this.turn.applied
        ? this.t('added_lines_of_css', [lines])
        : this.t('removed_lines_of_css', [lines]);
    },

    selectors(): string {
      return this.turn.edits.map(edit => edit.selector).join(', ');
    },
  },

  methods: {
    /**
     * Opens the Code tab with this reply's lines marked, leaving the picked
     * element as it was.
     */
    viewInCode(): void {
      const { applied, edits, previous } = this.turn;
      const ranges = applied
        ? findEditLines(this.$store.state.css, edits, previous)
        : [];

      this.$store.dispatch('setMode', 'code');

      // Once the editor is showing, so it scrolls with its real size.
      this.$nextTick(() => {
        if (ranges.length) {
          this.$store.commit('setCodeHighlight', ranges);
        }
      });
    },

    toggle(): void {
      this.$store.dispatch('chat/toggleTurn', this.turn.id);
    },
  },
});
</script>

<style lang="scss" scoped>
.chat-change {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  height: 34px;
  box-sizing: border-box;
  padding: 0 6px 0 11px;
  border: 1px solid var(--panel-border);
  border-radius: 9px;
  background: var(--card-surface);

  &.undone {
    background: var(--tab-surface);
  }
}

.chat-change-icon {
  flex: none;
  color: var(--success);

  .undone & {
    color: var(--text-faint);
  }
}

.chat-change .chat-change-label {
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-change.undone .chat-change-label {
  color: var(--text-faint);
}

.chat-change-spacer {
  flex: 1;
}

.chat-change-actions {
  flex: none;
  display: flex;
  align-items: center;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.12s;

  .chat-change:hover &,
  .chat-change:focus-within & {
    opacity: 1;
  }
}
</style>
