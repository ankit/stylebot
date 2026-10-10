<template>
  <span class="tile" :class="{ grid: urls.length > 1 }">
    <favicon
      v-for="url in urls.slice(0, 4)"
      :key="url"
      :url="url"
      :size="urls.length > 1 ? 10 : 16"
    />
  </span>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';

import Favicon from './Favicon.vue';

/**
 * A tile holding a site's favicon, or the first four of several sites'.
 */
export default Vue.extend({
  name: 'SiteIcon',

  components: {
    Favicon,
  },

  props: {
    urls: {
      type: Array as PropType<Array<string>>,
      required: true,
    },
  },
});
</script>

<style lang="scss" scoped>
.tile {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1px solid var(--panel-border);
  border-radius: 7px;
  box-sizing: border-box;
  background: var(--panel-surface);
}

.grid {
  display: grid;
  grid-template-columns: 10px 10px;
  gap: 2px;
  align-content: center;
  justify-content: center;
}
</style>
