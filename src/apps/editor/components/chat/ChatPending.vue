<template>
  <div class="chat-pending">
    <chat-markdown v-if="pending.text" :text="pending.text">
      <span v-if="pending.phase === 'writing'" class="chat-caret" />
    </chat-markdown>
    <chat-loader :label="label" />
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';

import ChatLoader from './ChatLoader.vue';
import ChatMarkdown from './ChatMarkdown.vue';
import type { ChatPhase, ChatState } from '../../store/chat';

const PHRASE_INTERVAL = 1600;

type Pending = NonNullable<ChatState['pending']>;

type TalkingPhase = Exclude<ChatPhase, 'applying'>;

export default Vue.extend({
  name: 'ChatPending',

  components: {
    ChatLoader,
    ChatMarkdown,
  },

  props: {
    pending: {
      type: Object as PropType<Pending>,
      required: true,
    },
  },

  data(): {
    phaseStart: number;
    phaseSeed: number;
    now: number;
    ticker: number;
  } {
    const now = Date.now();

    return {
      phaseStart: now,
      // Where in each list of phrases this reply starts, so replies vary.
      phaseSeed: Math.floor(Math.random() * 10),
      now,
      ticker: 0,
    };
  },

  computed: {
    phase(): ChatPhase {
      return this.pending.phase;
    },

    phrases(): Record<TalkingPhase, Array<string>> {
      return {
        reading: [
          this.t('reading_the_page'),
          this.t('squinting_at_the_markup'),
          this.t('counting_the_divs'),
          this.t('finding_the_right_selector'),
        ],
        writing: [
          this.t('picking_fonts'),
          this.t('mixing_colors'),
          this.t('nudging_pixels'),
          this.t('measuring_the_margins'),
          this.t('arguing_with_specificity'),
          this.t('rounding_some_corners'),
          this.t('choosing_a_nicer_shade'),
        ],
        fixing: [
          this.t('checking_the_result'),
          this.t('touching_up_what_missed'),
        ],
      };
    },

    /**
     * A rotating phrase while the model reads and writes, then the CSS
     * applied so far, growing as the reply's edits land.
     */
    label(): string {
      if (this.phase === 'applying') {
        const { lines } = this.pending;

        return lines === 1
          ? this.t('added_one_line')
          : this.t('added_count_lines', [String(lines)]);
      }

      const phrases = this.phrases[this.phase];
      const step = Math.floor((this.now - this.phaseStart) / PHRASE_INTERVAL);

      return phrases[(this.phaseSeed + Math.max(step, 0)) % phrases.length];
    },
  },

  watch: {
    phase(): void {
      this.now = Date.now();
      this.phaseStart = this.now;
    },
  },

  mounted() {
    // Moves the clock on to rotate the status phrase.
    this.ticker = window.setInterval(() => {
      this.now = Date.now();
    }, PHRASE_INTERVAL);
  },

  beforeDestroy() {
    window.clearInterval(this.ticker);
  },
});
</script>

<style lang="scss" scoped>
.chat-pending {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.chat-caret {
  display: inline-block;
  width: 2px;
  height: 1.05em;
  margin-left: 2px;
  vertical-align: -2px;
  background: var(--text-primary);
  animation: chat-caret 1s step-end infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
}

@keyframes chat-caret {
  0%,
  50% {
    opacity: 1;
  }

  51%,
  100% {
    opacity: 0;
  }
}
</style>
