<template>
  <span class="install-confirmation">
    <preview-summary
      :style-data="styleData"
      :title="t('style_installed', [styleData.name])"
      :status="t('added_to_your_styles_for_this_site')"
      confirming
    >
      <template #badge>
        <span class="badge">
          <check-icon class="tick" :size="10" />
        </span>
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
 * The bar once a style is installed: a check on its thumbnail, with Undo and
 * dismiss. Emits `undo` and `dismiss`.
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

.badge {
  position: absolute;
  right: -6px;
  bottom: -6px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--success);
  box-shadow: 0 0 0 2px var(--panel-surface);
  color: var(--panel-surface);
  animation: pop 420ms 140ms ease-out backwards;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
}

.tick ::v-deep path {
  stroke-width: 2;
  stroke-dasharray: 10;
  animation: draw 300ms 420ms ease-out backwards;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
}

.close {
  color: var(--icon-color);
}

@keyframes pop {
  0% {
    transform: scale(0);
  }

  60% {
    transform: scale(1.25);
  }
}

@keyframes draw {
  from {
    stroke-dashoffset: 10;
  }
}
</style>
