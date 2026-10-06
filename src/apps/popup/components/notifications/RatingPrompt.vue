<template>
  <section
    v-if="visible"
    class="rating-prompt"
    :aria-label="t('having_fun_restyling_the_web')"
  >
    <div class="rating-prompt-stars" aria-hidden="true">
      <star-icon
        v-for="n in 5"
        :key="n"
        :size="16"
        class="rating-prompt-star"
        :style="{ '--star': n }"
      />
    </div>

    <div class="rating-prompt-text">
      <s-text as="span" class="rating-prompt-title">
        {{ t('having_fun_restyling_the_web') }}
      </s-text>
      <s-text as="span" size="label" variant="muted">
        {{ t('a_quick_rating_helps_others_find_stylebot') }}
      </s-text>
    </div>

    <div class="rating-prompt-actions">
      <s-button size="small" variant="ghost" @click="dismiss">
        {{ t('not_now') }}
      </s-button>
      <s-button
        size="small"
        variant="primary"
        class="rating-prompt-rate"
        @click="rate"
      >
        {{ t('rate_stylebot') }}
      </s-button>
    </div>
  </section>
</template>

<script lang="ts">
import Vue from 'vue';
import { SButton, SText } from '@stylebot/components';
import { StarIcon } from '@stylebot/icons';

import {
  dismissRatingPrompt,
  getRatingPromptState,
  getReviewUrl,
  isEligibleForRatingPrompt,
} from '../../rating-prompt';

export default Vue.extend({
  name: 'RatingPrompt',

  components: {
    SButton,
    SText,
    StarIcon,
  },

  data(): {
    visible: boolean;
    reviewUrl: string | null;
  } {
    return {
      visible: false,
      reviewUrl: getReviewUrl(),
    };
  },

  async created() {
    if (!this.reviewUrl) {
      return;
    }

    this.visible = isEligibleForRatingPrompt(await getRatingPromptState());
  },

  methods: {
    async rate(): Promise<void> {
      if (this.reviewUrl) {
        chrome.tabs.create({ url: this.reviewUrl });
      }

      await this.dismiss();
      window.close();
    },

    dismiss(): Promise<void> {
      this.visible = false;
      return dismissRatingPrompt();
    },
  },
});
</script>

<style lang="scss" scoped>
.rating-prompt {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 12px 12px 16px;
  background: var(--info);
  border-top: 1px solid var(--info-border);
}

.rating-prompt-stars {
  display: flex;
  gap: 3px;
  color: var(--warning-icon);
}

.rating-prompt-star {
  animation: star-pop 420ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
  animation-delay: calc(var(--star) * 70ms);
  transform-origin: center;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
}

.rating-prompt:has(.rating-prompt-rate:hover) .rating-prompt-star,
.rating-prompt:has(.rating-prompt-rate:focus-visible) .rating-prompt-star {
  animation: star-hop 600ms ease-in-out infinite;
  animation-delay: calc(var(--star) * 80ms);

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
}

.rating-prompt-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.rating-prompt-title {
  font-weight: 600;
}

.rating-prompt-actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
}

@keyframes star-pop {
  from {
    opacity: 0;
    transform: scale(0.3) rotate(-30deg);
  }

  to {
    opacity: 1;
    transform: scale(1) rotate(0);
  }
}

@keyframes star-hop {
  0%,
  100% {
    transform: translateY(0);
  }

  40% {
    transform: translateY(-3px) rotate(8deg);
  }
}
</style>
