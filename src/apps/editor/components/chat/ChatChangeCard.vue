<template>
  <div class="chat-change" :class="{ undone: !turn.applied }">
    <button type="button" class="chat-change-open" @click="viewInCode">
      <code-icon :size="14" class="chat-change-icon" />
      <span class="chat-change-label">{{ summary }}</span>
    </button>
    <button
      v-if="latest"
      type="button"
      class="chat-change-action"
      :disabled="busy"
      @click="toggle"
    >
      {{ turn.applied ? t('undo') : t('reapply') }}
    </button>
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';

import { CodeIcon } from '@stylebot/icons';
import { countCssLines, findEditLines } from '@stylebot/chat';
import type { ChatAssistantTurn } from '@stylebot/types';

/**
 * What a reply changed on the page, opening it in the Code tab, with
 * Undo / Reapply for the latest.
 */
export default Vue.extend({
  name: 'ChatChangeCard',

  components: {
    CodeIcon,
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
      const lines = countCssLines(this.turn.edits);
      const verb = this.turn.applied ? 'added' : 'removed';

      return lines === 1
        ? this.t(`${verb}_one_line`)
        : this.t(`${verb}_count_lines`, [String(lines)]);
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
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  padding: 7px 8px;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1;
  color: var(--text-muted);

  &:hover {
    background: color-mix(in srgb, var(--text-primary) 4%, var(--tab-surface));
  }
}

.chat-change-open {
  @include button-reset;

  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  font-size: inherit;
  line-height: inherit;
  color: inherit;
  text-align: left;
  cursor: pointer;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
  }

  &:focus-visible {
    outline: none;
  }

  @include focus-ring(-2px, '::after');
}

.chat-change-icon {
  display: block;
  flex: none;
  color: color-mix(in srgb, var(--success) 80%, var(--tab-surface));

  .undone & {
    color: var(--text-faint);
  }
}

.chat-change-label {
  @include truncate;

  min-width: 0;

  .chat-change:hover & {
    color: var(--reading-ink);
  }

  .undone & {
    color: var(--text-faint);
  }
}

.chat-change-action {
  @include button-reset;

  position: relative;
  flex: none;
  margin: -3px -6px -3px 0;
  padding: 3px 6px;
  border-radius: 5px;
  font-size: inherit;
  line-height: 1;
  color: var(--text-body);
  cursor: pointer;

  &:hover:not(:disabled) {
    background: color-mix(in srgb, var(--text-primary) 8%, var(--tab-surface));
    color: var(--text-primary);
  }

  &:disabled {
    cursor: default;
    opacity: 0.5;
  }

  @include focus-ring(0);
}
</style>
