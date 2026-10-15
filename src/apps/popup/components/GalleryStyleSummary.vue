<template>
  <span class="summary">
    <img class="thumbnail" :src="thumbnail" alt="" />
    <span class="summary-text">
      <s-text as="span" size="large" medium class="truncated">
        {{ styleData.name }}
      </s-text>
      <slot />
    </span>
  </span>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';
import { SText } from '@stylebot/components';
import { getGalleryUrl } from '@stylebot/gallery';
import type { GalleryStyle } from '@stylebot/types';

/**
 * A gallery style's thumbnail and name, with a line about it in the slot.
 */
export default Vue.extend({
  name: 'GalleryStyleSummary',

  components: {
    SText,
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
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.thumbnail {
  flex: none;
  width: 52px;
  height: 32px;
  border: 1px solid var(--panel-border);
  border-radius: 5px;
  object-fit: cover;
  object-position: top left;
}

.summary-text {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.truncated {
  @include truncate;
}
</style>
