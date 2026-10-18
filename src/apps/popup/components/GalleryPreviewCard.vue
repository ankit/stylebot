<template>
  <div class="preview-card">
    <gallery-style-summary :style-data="styleData">
      <s-text as="span" size="caption" variant="muted">
        {{ t('preview_not_installed') }}
      </s-text>
    </gallery-style-summary>

    <div class="actions">
      <s-button
        variant="ghost"
        class="cancel"
        :disabled="installing"
        @click="$emit('cancel')"
      >
        {{ t('cancel') }}
      </s-button>
      <s-button
        class="install"
        :disabled="installing"
        @click="$emit('install')"
      >
        {{ installing ? t('installing') : t('install') }}
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
  gap: 12px;
  padding: 7px 9px 9px;
  background: var(--inset-surface);
  border: 1px solid var(--panel-border);
  border-radius: 8px;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
}

.preview-card .cancel.button:hover:not(:disabled) {
  background: var(--panel-border);
}

.preview-card .install.button:hover:not(:disabled) {
  background: var(--inset-button-hover);
  border-color: var(--inset-button-hover-border);
  box-shadow: var(--inset-button-hover-shadow);
}
</style>
