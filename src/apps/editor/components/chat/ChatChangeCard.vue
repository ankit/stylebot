<template>
  <div
    class="chat-change"
    :class="{ undone: !turn.applied, older: !latest }"
    :role="latest ? undefined : 'button'"
    :tabindex="latest ? undefined : 0"
    @click="openOlder"
    @keydown.enter.space.self.prevent="openOlder"
  >
    <logo-icon :size="12" class="chat-change-mark" aria-hidden="true" />
    <span class="chat-change-label">{{ label }}</span>
    <chat-change-diff
      v-if="turn.applied"
      class="chat-change-count"
      :added="summary.added"
      :removed="summary.removed"
    >
      <button
        v-if="latest"
        type="button"
        class="chat-change-open"
        :aria-label="t('view_code')"
        @click="viewInCode"
      >
        <chevron-right-icon :size="12" />
      </button>
    </chat-change-diff>
    <button
      v-if="latest"
      type="button"
      class="chat-change-undo"
      :disabled="busy"
      @click="toggleApplied"
    >
      <undo-icon v-if="turn.applied" :size="14" />
      <arrow-repeat-icon v-else :size="14" />
      {{ turn.applied ? t('undo') : t('reapply') }}
    </button>
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';

import { findEditLines, summarizeChanges } from '@stylebot/chat';
import {
  ArrowRepeatIcon,
  ChevronRightIcon,
  LogoIcon,
  UndoIcon,
} from '@stylebot/icons';
import type { ChatChangeSummary } from '@stylebot/chat';
import type { ChatAssistantTurn } from '@stylebot/types';

import ChatChangeDiff from './ChatChangeDiff.vue';

type ChatChange = Pick<
  ChatAssistantTurn,
  'id' | 'edits' | 'previous' | 'applied'
>;

/**
 * The row that ends a reply which changed the page, with a diff count of
 * its declarations, leaving out a side that's 0. On the latest reply the
 * count opens them in the Code tab, beside Undo / Reapply; an older one
 * fades, and the whole row opens it in Code.
 */
export default Vue.extend({
  name: 'ChatChangeCard',

  components: {
    ArrowRepeatIcon,
    ChatChangeDiff,
    ChevronRightIcon,
    LogoIcon,
    UndoIcon,
  },

  props: {
    turn: {
      type: Object as PropType<ChatChange>,
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
    summary(): ChatChangeSummary {
      return summarizeChanges(this.turn.edits, this.turn.previous);
    },

    label(): string {
      if (!this.turn.applied) {
        return this.t('styles_undone');
      }

      return this.t('updated_styles');
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

    openOlder(): void {
      if (!this.latest) {
        this.viewInCode();
      }
    },

    toggleApplied(): void {
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
  min-height: 28px;
  margin: 0 -8px;
  padding: 3px 8px;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1;
  color: var(--text-muted);

  &.older {
    &:hover {
      background: color-mix(
        in srgb,
        var(--text-primary) 5%,
        var(--tab-surface)
      );
    }

    @include focus-ring(0);
  }
}

.chat-change-mark {
  display: block;
  flex: none;

  .older & {
    opacity: 0.5;
  }

  .undone & {
    opacity: 0.45;
    filter: grayscale(1);
  }
}

.chat-change-label {
  @include truncate;

  min-width: 0;
  font-weight: 500;
  color: var(--reading-ink);

  .older & {
    color: var(--text-muted);
  }

  .undone & {
    color: var(--text-faint);
  }
}

.chat-change-count {
  margin-left: 2px;
}

.chat-change-open {
  @include button-reset;

  display: flex;
  align-items: center;
  padding: 3px;
  background: color-mix(in srgb, var(--text-primary) 6%, var(--tab-surface));
  color: var(--text-muted);
  cursor: pointer;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 5px;
  }

  &:focus-visible {
    outline: none;
  }

  .chat-change-count:hover & {
    background: color-mix(in srgb, var(--text-primary) 11%, var(--tab-surface));
    color: var(--text-primary);
  }

  @include focus-ring(-2px, '::after');
}

.chat-change-undo {
  @include button-reset;

  display: flex;
  flex: none;
  align-items: center;
  gap: 6px;
  margin-left: auto;
  padding: 5px 9px;
  border: 1px solid var(--field-border);
  border-radius: 7px;
  font-size: 12px;
  line-height: 1;
  color: var(--text-body);
  cursor: pointer;

  &:hover:not(:disabled) {
    background: color-mix(in srgb, var(--text-primary) 5%, var(--tab-surface));
    color: var(--text-primary);
  }

  &:disabled {
    cursor: default;
    opacity: 0.5;
  }

  @include focus-ring(1px);
}
</style>
