<template>
  <span class="hide-distractions">
    <span class="ad">
      <preview-bar :width="70" />
      <preview-bar :width="45" />
      <span class="strike" />
    </span>
  </span>
</template>

<script lang="ts">
import Vue from 'vue';

import PreviewBar from './PreviewBar.vue';

export default Vue.extend({
  name: 'HideDistractionsPreview',

  components: {
    PreviewBar,
  },
});
</script>

<style lang="scss" scoped>
.ad {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  width: 38px;
  height: 28px;
  padding: 0 6px;
  box-sizing: border-box;
  border: 1.5px solid var(--muted);
  border-radius: 4px;
}

.strike {
  position: absolute;
  top: 50%;
  right: -5px;
  left: -5px;
  height: 2px;
  background: var(--pink);
  transform: rotate(-30deg);
}
</style>
