<template>
  <section
    v-if="visible"
    class="rating-prompt"
    :aria-label="t('enjoying_stylebot')"
  >
    <div class="rating-prompt-header">
      <s-heading as="h2" size="md" class="rating-prompt-title">
        {{ t('enjoying_stylebot') }}
      </s-heading>

      <s-icon-button
        class="rating-prompt-dismiss"
        :tooltip="t('dismiss')"
        @click="dismiss"
      >
        <x-icon :size="16" />
      </s-icon-button>
    </div>

    <s-text variant="muted" class="rating-prompt-body">
      {{
        t(
          'if_stylebot_has_made_the_web_nicer_for_you_a_quick_rating_helps_others_find_it'
        )
      }}
    </s-text>

    <div>
      <s-button variant="primary" @click="rate">
        {{ t('rate_stylebot') }}
      </s-button>
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
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px 12px 16px 16px;
  background: var(--info);
  border-top: 1px solid var(--info-border);
}

.rating-prompt-header {
  display: flex;
  align-items: flex-start;
  gap: 8px;

  .rating-prompt-title {
    flex: 1;
    min-width: 0;
    font-weight: 500;
  }
}

.rating-prompt-dismiss {
  flex: none;
  margin-top: -4px;

  ::v-deep .icon-button {
    padding: 5px;
    color: var(--text-muted);

    &:hover {
      background: var(--info-border);
    }
  }
}

.rating-prompt-body {
  padding-right: 32px;
  margin-bottom: 8px;
}
</style>
