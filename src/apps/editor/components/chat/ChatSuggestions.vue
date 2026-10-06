<template>
  <div v-if="suggestions.length" class="chat-suggestions">
    <div class="chat-suggestions-header">
      <button type="button" class="chat-suggestions-more" @click="more">
        <shuffle-icon
          class="chat-suggestions-shuffle"
          :size="14"
          :style="{ transform: `rotate(${spin}deg)` }"
        />
        <s-text as="span" size="label" variant="primary">
          {{ t('more_ideas') }}
        </s-text>
      </button>
    </div>

    <div
      ref="deck"
      class="chat-suggestions-deck"
      :style="{ minHeight: deckHeight ? `${deckHeight}px` : undefined }"
    >
      <transition name="deal" :duration="dealDuration">
        <div
          :key="round"
          class="chat-suggestions-grid"
          role="group"
          :aria-label="t('what_should_this_site_look_like')"
        >
          <div
            v-for="(item, i) in suggestions"
            :key="item.id"
            class="chat-suggestions-slot"
            :style="{ '--i': i, '--turn': i % 2 ? 1 : -1 }"
          >
            <s-sticker-card :tilt="i % 3" @click="choose(item, $event)">
              <template #preview>
                <chat-suggestion-preview
                  :id="item.id"
                  :theme="item.substitutions ? item.substitutions[0] : ''"
                />
              </template>
              {{ t(item.label, item.substitutions) }}
            </s-sticker-card>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import {
  CREATIVE_SUGGESTIONS,
  getCreativeSuggestions,
  getPracticalSuggestions,
} from '@stylebot/chat';
import type { ChatSuggestion } from '@stylebot/chat';
import { SStickerCard, SText } from '@stylebot/components';
import { ShuffleIcon } from '@stylebot/icons';
import { getPageBridge } from '@stylebot/page-bridge';
import type { ChatPageSignals } from '@stylebot/types';

import ChatSuggestionPreview from './ChatSuggestionPreview.vue';

const CARDS = 3;

// How long the cards take to clear away and to deal in, staggers included.
const DEAL_DURATION = { leave: 260, enter: 720 };

// Where the creative requests start; each empty chat moves it on, so the
// next one opens on another look.
let creativeStart = -1;

type Data = {
  reducedMotion: boolean;
  signals: ChatPageSignals | null;
  loaded: boolean;
  start: number;
  round: number;
  spin: number;
  deckHeight: number;
};

/**
 * Requests to start a chat with, as cards: first the page's best two and a
 * creative look, then three more looks each time More ideas is pressed.
 * Clicking one sends it; Shift-clicking puts it in the message field to
 * edit first.
 */
export default Vue.extend({
  name: 'ChatSuggestions',

  components: {
    ChatSuggestionPreview,
    SStickerCard,
    SText,
    ShuffleIcon,
  },

  data(): Data {
    return {
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)')
        .matches,
      signals: null,
      loaded: false,
      start: 0,
      round: 0,
      spin: 0,
      deckHeight: 0,
    };
  },

  computed: {
    dealDuration(): { leave: number; enter: number } {
      return this.reducedMotion ? { leave: 0, enter: 0 } : DEAL_DURATION;
    },

    suggestions(): Array<ChatSuggestion> {
      if (!this.loaded) {
        return [];
      }

      if (this.round > 0) {
        return getCreativeSuggestions(
          this.start + 1 + (this.round - 1) * CARDS,
          CARDS
        );
      }

      const practical = getPracticalSuggestions({
        signals: this.signals,
        article: !!this.$store.state.page.readerable,
      });

      return [
        ...practical,
        ...getCreativeSuggestions(this.start, CARDS - practical.length),
      ];
    },

    url(): string {
      return this.$store.state.url;
    },
  },

  watch: {
    url: 'readSignals',
  },

  mounted() {
    const total = CREATIVE_SUGGESTIONS.length;
    creativeStart =
      creativeStart < 0
        ? Math.floor(Math.random() * total)
        : creativeStart + 1 + Math.floor(Math.random() * (total - 1));
    this.start = creativeStart;
    this.readSignals();
  },

  methods: {
    async readSignals(): Promise<void> {
      this.signals = await getPageBridge()
        .getPageSignals()
        .catch(() => null);
      this.loaded = true;
    },

    /**
     * Deals the next three looks. The cards keep the tallest height they've
     * had, so a set with shorter labels doesn't move the empty state, which
     * sits at the bottom of the panel.
     */
    more(): void {
      const deck = this.$refs.deck as HTMLElement | undefined;
      this.deckHeight = Math.max(this.deckHeight, deck?.offsetHeight ?? 0);
      this.round++;
      this.spin += 180;
    },

    choose(item: ChatSuggestion, event: MouseEvent): void {
      if (event.shiftKey) {
        this.$emit('fill', item.request);
        return;
      }

      this.$store.dispatch('chat/sendDraft', item.request);
    },
  },
});
</script>

<style lang="scss" scoped>
.chat-suggestions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.chat-suggestions-header {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 0 4px;
}

.chat-suggestions-more {
  @include button-reset;

  display: flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  margin-right: -8px;
  padding: 0 8px;
  border-radius: 6px;
  color: var(--accent-text);
  cursor: pointer;

  &:hover {
    background: var(--hover-tint);
  }

  &:active {
    transform: scale(0.96);
  }

  @include focus-ring;
}

.chat-suggestions-shuffle {
  transition: transform 0.35s cubic-bezier(0.3, 1.5, 0.5, 1);

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
}

.chat-suggestions-deck {
  display: grid;
  align-items: end;
  padding: 0 4px;
}

.chat-suggestions-grid {
  grid-area: 1 / 1;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.chat-suggestions-slot {
  display: grid;
  min-width: 0;
}

.deal-leave-active {
  pointer-events: none;
}

.deal-leave-active .chat-suggestions-slot {
  animation: deal-out 0.18s ease-in calc(var(--i) * 40ms) both;
}

.deal-enter-active .chat-suggestions-slot {
  animation: deal-in 0.44s cubic-bezier(0.3, 1.5, 0.5, 1)
    calc(140ms + var(--i) * 70ms) both;
}

@media (prefers-reduced-motion: reduce) {
  .deal-leave-active .chat-suggestions-slot,
  .deal-enter-active .chat-suggestions-slot {
    animation: none;
  }
}

@keyframes deal-out {
  to {
    opacity: 0;
    transform: translateY(-12px) rotate(calc(var(--turn) * 6deg)) scale(0.9);
  }
}

@keyframes deal-in {
  from {
    opacity: 0;
    transform: translateY(-18px) rotate(calc(var(--turn) * -8deg)) scale(0.9);
  }

  to {
    opacity: 1;
    transform: none;
  }
}
</style>
