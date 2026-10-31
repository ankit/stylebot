<template>
  <ol class="thread">
    <li v-if="!thread.length" class="comment">
      # {{ t('what_your_agent_does_on_this_tab_shows_here') }}
    </li>

    <template v-for="(entry, index) in thread">
      <li v-if="entry.kind === 'turn'" :key="entry.id" class="turn">
        <div class="turn-head">
          <button
            type="button"
            class="turn-toggle"
            :aria-expanded="String(open.includes(entry.id))"
            @click="toggle(entry.id)"
          >
            <cli-spinner v-if="isLive(index)" class="sigil" />
            <span v-else class="caret">
              {{ open.includes(entry.id) ? '▾' : '▸' }}
            </span>
            <span class="turn-text">
              {{
                isLive(index) ? `stylebot ${activity}` : summarizeTurn(entry)
              }}
            </span>
          </button>
          <button
            v-if="!open.includes(entry.id) && lastUndoableSave(entry.steps)"
            type="button"
            class="undo"
            :title="t('label_with_key', [t('undo_the_last_save'), 'Z'])"
            @click="$emit('undo', lastUndoableSave(entry.steps).id)"
          >
            {{ t('undo_bracketed') }}
          </button>
        </div>

        <ol v-if="open.includes(entry.id)" class="steps">
          <li
            v-for="step in entry.steps"
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

      <li v-else-if="entry.kind === 'note'" :key="entry.id" class="note">
        <span class="sigil">›</span>
        <span class="message">
          <span class="body">{{ entry.text }}</span>
          <span v-if="entry.marks.length" class="refs">
            {{ entry.marks.map(circled).join('') }}
          </span>
        </span>
      </li>

      <li v-else :key="entry.id" class="reply">
        <span class="message body">{{ entry.text }}</span>
      </li>
    </template>

    <li v-if="working" class="turn">
      <span class="turn-toggle live">
        <cli-spinner class="sigil" />
        <span class="turn-text">
          {{ activity ? `stylebot ${activity}` : t('thinking') }}
        </span>
      </span>
    </li>
  </ol>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';
import type { CliThreadEntry } from '@stylebot/types';

import { circled, lastUndoableSave, summarizeTurn } from '../thread';
import CliSpinner from './CliSpinner.vue';

/**
 * CLI mode's thread, as a terminal: the user's notes as prompts with the
 * agent's replies under them, and each turn of commands between them folded
 * into one line, opened to list each command and save. Emits `undo`.
 */
export default Vue.extend({
  name: 'CliThread',

  components: { CliSpinner },

  props: {
    thread: {
      type: Array as PropType<Array<CliThreadEntry>>,
      required: true,
    },

    // What the agent is running now, which keeps the last turn live.
    activity: {
      type: String as PropType<string | null>,
      default: null,
    },

    // The agent is working on the user's note between its commands.
    thinking: {
      type: Boolean,
      default: false,
    },
  },

  data() {
    return { open: [] as Array<number> };
  },

  computed: {
    // The agent works with no live turn to show it, so a line of its own does.
    working(): boolean {
      return (
        (this.thinking || !!this.activity) &&
        !this.isLive(this.thread.length - 1)
      );
    },
  },

  methods: {
    circled,
    summarizeTurn,
    lastUndoableSave,

    isLive(index: number): boolean {
      return (
        !!this.activity &&
        index === this.thread.length - 1 &&
        this.thread[index]?.kind === 'turn'
      );
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

.note,
.reply {
  display: flex;
  gap: 8px;
  overflow-wrap: anywhere;
}

.note {
  color: var(--term-bright);
}

.reply {
  padding-left: 16px;
  color: var(--term-text);
}

.message {
  flex: 1;
  min-width: 0;
}

.body {
  white-space: pre-wrap;
}

.refs {
  margin-left: 4px;
  color: var(--term-accent);
  letter-spacing: 1px;
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

  &.live {
    cursor: default;
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
