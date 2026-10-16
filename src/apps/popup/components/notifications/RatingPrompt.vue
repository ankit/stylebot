<template>
  <section
    v-if="visible"
    class="rating-prompt"
    :aria-label="t('enjoying_stylebot')"
  >
    <div class="rating-prompt-card">
      <div class="rating-prompt-text">
        <s-heading as="h2" size="md">
          {{ t('enjoying_stylebot') }}
        </s-heading>

        <s-text variant="muted">
          {{
            t(
              'if_stylebot_has_made_the_web_nicer_for_you_a_quick_rating_helps_others_find_it'
            )
          }}
        </s-text>
      </div>

      <div>
        <s-button class="rating-prompt-rate" @click="rate">
          {{ t('rate_stylebot') }}
        </s-button>
      </div>

      <s-icon-button
        class="rating-prompt-dismiss"
        :size="28"
        :tooltip="t('dismiss')"
        @click="dismiss"
      >
        <x-icon :size="14" />
      </s-icon-button>
    </div>
  </section>
</template>

<script lang="ts">
import Vue from 'vue';
import { SButton, SHeading, SIconButton, SText } from '@stylebot/components';
import { XIcon } from '@stylebot/icons';

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
    SHeading,
    SIconButton,
    SText,
    XIcon,
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
  padding: 0 12px 12px;
}

.rating-prompt-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px;
  background: var(--inset-surface);
  border: 1px solid var(--panel-border);
  border-radius: 8px;
}

.rating-prompt-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-right: 24px;
}

.rating-prompt-card .rating-prompt-rate.button:hover:not(:disabled) {
  background: var(--inset-button-hover);
  border-color: var(--inset-button-hover-border);
  box-shadow: var(--inset-button-hover-shadow);
}

.rating-prompt-dismiss {
  position: absolute;
  top: 8px;
  right: 8px;

  ::v-deep .icon-button {
    padding: 0;
    border-radius: 7px;
    color: var(--text-muted);

    &:hover {
      color: var(--text-primary);
      background: var(--panel-border);
    }
  }
}
</style>
