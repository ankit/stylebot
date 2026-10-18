<template>
  <span class="summary">
    <s-thumbnail class="thumbnail" :src="thumbnail" :width="52" :height="32" />
    <span class="summary-text">
      <s-text as="span" size="large" class="name">
        {{ styleData.name }}
      </s-text>
      <slot />
    </span>
  </span>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';
import { SText, SThumbnail } from '@stylebot/components';
import { getGalleryUrl } from '@stylebot/gallery';
import type { GalleryStyle } from '@stylebot/types';

/**
 * A gallery style's thumbnail and name, with a line about it in the slot.
 */
export default Vue.extend({
  name: 'GalleryStyleSummary',

  components: {
    SText,
    SThumbnail,
  },

  props: {
    styleData: {
      type: Object as PropType<GalleryStyle>,
      required: true,
    },
  },

  computed: {
    thumbnail(): string {
      return getGalleryUrl(this.styleData.screenshot);
    },
  },
});
</script>

<style lang="scss" scoped>
.summary {
  display: flex;
  flex: 1;
  align-items: flex-start;
  gap: 12px;
  min-width: 0;
}

.summary .thumbnail {
  margin-top: 4px;
}

.summary-text {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.name {
  display: -webkit-box;
  overflow: hidden;
  overflow-wrap: anywhere;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
</style>
