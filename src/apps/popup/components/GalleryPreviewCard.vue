<template>
  <div class="preview-card">
    <gallery-style-summary :style-data="styleData">
      <s-text as="span" size="caption" variant="primary">
        {{ t('previewing_on_this_page') }}
      </s-text>
    </gallery-style-summary>

    <div class="actions">
      <s-button
        variant="primary"
        :disabled="installing"
        @click="$emit('install')"
      >
        {{ t('install') }}
      </s-button>
      <s-button :disabled="installing" @click="$emit('cancel')">
        {{ t('cancel') }}
      </s-button>
    </div>
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';
import { SButton, SText } from '@stylebot/components';
import type { GalleryStyle } from '@stylebot/types';

import GalleryStyleSummary from './GalleryStyleSummary.vue';

/**
 * The gallery style previewing on the page, with `install` and `cancel`.
 */
export default Vue.extend({
  name: 'GalleryPreviewCard',

  components: {
    GalleryStyleSummary,
    SButton,
    SText,
  },

  props: {
    styleData: {
      type: Object as PropType<GalleryStyle>,
      required: true,
    },

    installing: {
      type: Boolean,
      default: false,
    },
  },
});
</script>

<style lang="scss" scoped>
.preview-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 8px 10px 10px;
  border-radius: 8px;
  background: color-mix(in srgb, var(--accent) 8%, var(--panel-surface));
  box-shadow: inset 0 0 0 1px
    color-mix(in srgb, var(--accent) 28%, var(--panel-surface));
}

.actions {
  display: flex;
  gap: 6px;

  .button {
    flex: 1;
  }
}
</style>
