<template>
  <section
    v-if="visible"
    class="rating-prompt"
    :aria-label="t('enjoying_stylebot')"
  >
    <div class="rating-prompt-text">
      <s-text as="span" class="rating-prompt-title">
        {{ t('enjoying_stylebot') }}
      </s-text>
      <s-text as="span" size="label" variant="muted">
        {{ t('a_rating_helps_others_find_it') }}
      </s-text>
    </div>

    <div class="rating-prompt-actions">
      <s-button size="small" variant="ghost" @click="dismiss">
        {{ t('not_now') }}
      </s-button>
      <s-button size="small" variant="primary" @click="rate">
        {{ t('rate_stylebot') }}
      </s-button>
    </div>
  </section>
</template>

<script lang="ts">
import Vue from 'vue';
import { SButton, SText } from '@stylebot/components';

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
  gap: 10px;
  padding: 12px 12px 12px 16px;
  background: var(--info);
  border-top: 1px solid var(--info-border);
}

.rating-prompt-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.rating-prompt-title {
  font-weight: 500;
}

.rating-prompt-actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
}
</style>
