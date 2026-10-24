<template>
  <span class="install-confirmation">
    <preview-summary
      :title="t('style_installed', [styleData.name])"
      :status="t('applied_to_site', [styleData.site])"
      confirming
    >
      <template #icon>
        <check-icon class="tick" :size="18" />
      </template>
    </preview-summary>

    <s-button :disabled="undoing" @click="$emit('undo')">
      {{ t('undo') }}
    </s-button>
    <s-icon-button
      class="close"
      :size="33"
      :title="t('dismiss')"
      :aria-label="t('dismiss')"
      @click="$emit('dismiss')"
    >
      <x-icon :size="14" />
    </s-icon-button>
  </span>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';
import { SButton, SIconButton } from '@stylebot/components';
import { CheckIcon, XIcon } from '@stylebot/icons';
import type { GalleryStyle } from '@stylebot/types';

import PreviewSummary from './PreviewSummary.vue';

/**
 * The bar once a style is installed, with a check, where it applies, Undo
 * and dismiss. Emits `undo` and `dismiss`.
 */
export default Vue.extend({
  name: 'InstallConfirmation',

  components: {
    CheckIcon,
    PreviewSummary,
    SButton,
    SIconButton,
    XIcon,
  },

  props: {
    styleData: {
      type: Object as PropType<GalleryStyle>,
      required: true,
    },

    undoing: {
      type: Boolean,
      default: false,
    },
  },
});
</script>

<style lang="scss" scoped>
.install-confirmation {
  display: contents;
}

.close {
  color: var(--icon-color);
}

.tick {
  flex: none;
  margin-right: 4px;
  color: var(--success);
}
</style>
