<template>
  <span class="easier-to-read">
    <span class="lines">
      <preview-bar :width="70" :height="7" />
      <preview-bar :width="50" :height="7" />
    </span>
  </span>
</template>

<script lang="ts">
import Vue from 'vue';

import PreviewBar from './PreviewBar.vue';

export default Vue.extend({
  name: 'EasierToReadPreview',

  components: {
    PreviewBar,
  },
});
</script>

<style lang="scss" scoped>
.easier-to-read {
  --bar: var(--yellow);
  --bar-radius: 3px;

  background: color-mix(in srgb, var(--yellow) 16%, transparent);
}

.lines {
  display: flex;
  flex-direction: column;
  gap: 5px;
  width: 66%;
}
</style>
