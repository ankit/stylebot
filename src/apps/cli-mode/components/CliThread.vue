<template>
  <ol class="thread">
    <li v-if="!thread.length" class="comment">
      # {{ t('what_your_agent_does_on_this_tab_shows_here') }}
    </li>

    <li v-for="(turn, index) in thread" :key="turn.id" class="turn">
      <div class="turn-head">
        <button
          type="button"
          class="turn-toggle"
          :aria-expanded="String(open.includes(turn.id))"
          @click="toggle(turn.id)"
        >
          <cli-spinner v-if="isLive(index)" class="sigil" />
          <span v-else class="caret">
            {{ open.includes(turn.id) ? '▾' : '▸' }}
          </span>
          <span class="turn-text">
            {{ isLive(index) ? `stylebot ${activity}` : summarizeTurn(turn) }}
          </span>
        </button>
        <button
          v-if="!open.includes(turn.id) && lastUndoableSave(turn.steps)"
          type="button"
          class="undo"
          :title="t('label_with_key', [t('undo_the_last_save'), 'Z'])"
          @click="$emit('undo', lastUndoableSave(turn.steps).id)"
        >
          {{ t('undo_bracketed') }}
        </button>
      </div>

      <ol v-if="open.includes(turn.id)" class="steps">
        <li
          v-for="step in turn.steps"
          :key="step.id"
          class="step"
          :class="step.kind"
        >
          <template v-if="step.kind === 'command'">
            <span class="sigil">$</span>
            <span class="step-text">stylebot {{ step.text }}</span>
          </template>
          <template v-else>
            <span class="check">✓</span>
            <span class="step-text">
              {{ t('saved_the_style_for_url', [step.url]) }}
            </span>
            <span v-if="step.undone" class="undone">{{ t('undone') }}</span>
            <button
              v-else
              type="button"
              class="undo"
              @click="$emit('undo', step.id)"
            >
              {{ t('undo_bracketed') }}
            </button>
          </template>
        </li>
      </ol>
    </li>
  </ol>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';
import type { CliTurn } from '@stylebot/types';

import { lastUndoableSave, summarizeTurn } from '../thread';
import CliSpinner from './CliSpinner.vue';

/**
 * What the agent did on the tab, as a terminal: each turn of commands folded
 * into one line, opened to list each command and save. Emits `undo`.
 */
export default Vue.extend({
  name: 'CliThread',

  components: { CliSpinner },

  props: {
    thread: {
      type: Array as PropType<Array<CliTurn>>,
      required: true,
    },

    // What the agent is running now, which keeps the last turn live.
    activity: {
      type: String as PropType<string | null>,
      default: null,
    },
  },

  data() {
    return { open: [] as Array<number> };
  },

  methods: {
    summarizeTurn,
    lastUndoableSave,

    isLive(index: number): boolean {
      return !!this.activity && index === this.thread.length - 1;
    },

    toggle(id: number): void {
      this.open = this.open.includes(id)
        ? this.open.filter(other => other !== id)
        : [...this.open, id];
    },
  },
});
</script>

<style lang="scss" scoped>
.thread {
  @include thin-scrollbar;

  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 0;
  margin: 0;
  padding: 12px 14px 10px;
  overflow-y: auto;
  list-style: none;
}

.comment {
  color: var(--term-faint);
}

.turn {
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: var(--term-text);
  overflow-wrap: anywhere;
}

.turn-head {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.turn-toggle,
.undo {
  margin: 0;
  padding: 0;
  border: 0;
  border-radius: 3px;
  background: none;
  font: inherit;
  appearance: none;
  cursor: pointer;

  &:focus-visible {
    outline: 1px solid var(--term-accent);
    outline-offset: 2px;
  }
}

.turn-toggle {
  display: flex;
  flex: 1;
  gap: 8px;
  min-width: 0;
  color: var(--term-dim);
  text-align: left;

  &:hover {
    color: var(--term-text);
  }
}

.sigil {
  flex: none;
  color: var(--term-accent);
  font-weight: 600;
}

.caret {
  flex: none;
  width: 9px;
}

.turn-text,
.step-text {
  @include truncate;

  min-width: 0;
}

.steps {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin: 0 0 0 17px;
  padding: 0;
  list-style: none;
}

.step {
  display: flex;
  gap: 8px;
  min-width: 0;
  color: var(--term-faint);

  .sigil {
    color: var(--term-faint);
    font-weight: 400;
  }

  &.save {
    color: var(--term-dim);
  }
}

.step-text {
  flex: 1;
}

.check {
  flex: none;
  color: var(--term-green);
}

.undo {
  flex: none;
  color: var(--term-accent);

  &:hover {
    text-decoration: underline;
  }
}

.undone {
  flex: none;
  color: var(--term-faint);
}
</style>
