<template>
  <div class="install-confirmation">
    <preview-summary
      :title="t('style_installed', [styleData.name])"
      :status="styleData.site"
      confirming
    >
      <template #icon>
        <span class="tick"><check-icon :size="14" /></span>
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
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';
import { SButton, SIconButton } from '@stylebot/components';
import { CheckIcon, XIcon } from '@stylebot/icons';
import type { GalleryStyle } from '@stylebot/types';

import PreviewSummary from './PreviewSummary.vue';

/**
 * The card once a style is installed, with a check, where it applies, Undo
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
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 10px 12px 16px;
}

.close {
  flex: none;
  color: var(--icon-color);
}

.tick {
  display: grid;
  flex: none;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--success-background);
  color: var(--success);
}
</style>
