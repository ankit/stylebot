<template>
  <popup-row
    button
    class="suggestion"
    :disabled="disabled"
    @click="$emit('preview')"
  >
    <gallery-style-summary :style-data="styleData">
      <s-text as="span" size="caption" variant="muted" class="meta">
        {{ meta }}
      </s-text>
    </gallery-style-summary>
    <s-text as="span" size="caption" medium class="preview-hint">
      {{ t('preview') }}
    </s-text>
  </popup-row>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';
import { SText } from '@stylebot/components';
import type { GalleryStyle } from '@stylebot/types';

import GalleryStyleSummary from './GalleryStyleSummary.vue';
import PopupRow from './PopupRow.vue';

/**
 * A suggested gallery style, with its author and installs. Emits `preview`
 * when clicked.
 */
export default Vue.extend({
  name: 'GallerySuggestion',

  components: {
    GalleryStyleSummary,
    PopupRow,
    SText,
  },

  props: {
    styleData: {
      type: Object as PropType<GalleryStyle>,
      required: true,
    },

    disabled: {
      type: Boolean,
      default: false,
    },
  },

  computed: {
    meta(): string {
      const { author, installs } = this.styleData;
      const count = new Intl.NumberFormat(undefined, {
        notation: 'compact',
      }).format(installs);
      const installsText = this.t(
        installs === 1 ? 'installs_one' : 'installs_other',
        [count]
      );

      if (!author.name) {
        return installsText;
      }

      return `${author.name} · ${installsText}`;
    },
  },
});
</script>

<style lang="scss" scoped>
.meta {
  @include truncate;
}

.preview-hint {
  flex: none;
  visibility: hidden;

  .suggestion:hover &,
  .suggestion:focus-visible & {
    visibility: visible;
  }
}
</style>
