<template>
  <span class="preview-controls">
    <preview-summary
      :title="styleData.name"
      :href="styleUrl"
      :status="held ? t('showing_original_page') : byline"
      :dimmed="held"
    />

    <s-color-scheme-switch
      v-if="scheme"
      :value="scheme"
      :class="{ dimmed: held }"
      @change="$emit('scheme', $event)"
    />
    <hold-to-compare-button :disabled="installing" @change="compare" />
    <install-button
      :class="{ dimmed: held }"
      :installing="installing"
      @install="$emit('install')"
      @filled="$emit('filled')"
    />
    <s-icon-button
      class="close"
      :size="33"
      :tooltip="t('stop_preview')"
      tooltip-shortcut="esc"
      :disabled="installing"
      @click="$emit('cancel')"
    >
      <x-icon :size="14" />
    </s-icon-button>
  </span>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';
import { SColorSchemeSwitch, SIconButton } from '@stylebot/components';
import { XIcon } from '@stylebot/icons';
import { getGalleryByline, getGalleryStyleUrl } from '@stylebot/gallery';
import type { GalleryStyle, StyleColorScheme } from '@stylebot/types';

import HoldToCompareButton from './HoldToCompareButton.vue';
import InstallButton from './InstallButton.vue';
import PreviewSummary from './PreviewSummary.vue';

/**
 * The bar while it previews a style: its color scheme when it declares one,
 * hold to compare, Install, and cancel.
 * Emits `scheme`, `compare`, `install`, `filled` and `cancel`.
 */
export default Vue.extend({
  name: 'PreviewControls',

  components: {
    HoldToCompareButton,
    InstallButton,
    PreviewSummary,
    SColorSchemeSwitch,
    SIconButton,
    XIcon,
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

    // The color scheme shown, when the style declares one.
    scheme: {
      type: String as PropType<StyleColorScheme | undefined>,
      default: undefined,
    },
  },

  data() {
    return {
      held: false,
    };
  },

  computed: {
    styleUrl(): string {
      return getGalleryStyleUrl(this.styleData);
    },

    byline(): string {
      return getGalleryByline(this.styleData);
    },
  },

  methods: {
    compare(held: boolean): void {
      this.held = held;
      this.$emit('compare', held);
    },
  },
});
</script>

<style lang="scss" scoped>
.preview-controls {
  display: contents;
}

.close {
  color: var(--icon-color);
}

.dimmed {
  opacity: 0.5;
  transition: opacity 0.12s ease;
}
</style>
