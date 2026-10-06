<template>
  <span class="compact">
    <span class="lines">
      <preview-bar :width="80" />
      <preview-bar :width="60" />
      <preview-bar :width="72" />
      <preview-bar :width="50" />
      <preview-bar :width="66" />
    </span>
  </span>
</template>

<script lang="ts">
import Vue from 'vue';

import PreviewBar from './PreviewBar.vue';

export default Vue.extend({
  name: 'CompactPreview',

  components: {
    PreviewBar,
  },
});
</script>

<style lang="scss" scoped>
.compact {
  --bar: var(--green);

  background: color-mix(in srgb, var(--green) 16%, transparent);
}

.lines {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 66%;
}
</style>
