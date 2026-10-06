<template>
  <span class="unpin-header">
    <span class="lines">
      <span class="removed" />
      <preview-bar />
      <preview-bar :width="70" />
    </span>
  </span>
</template>

<script lang="ts">
import Vue from 'vue';

import PreviewBar from './PreviewBar.vue';

export default Vue.extend({
  name: 'UnpinHeaderPreview',

  components: {
    PreviewBar,
  },
});
</script>

<style lang="scss" scoped>
.lines {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 66%;
}

.removed {
  height: 10px;
  margin-bottom: 2px;
  box-sizing: border-box;
  border: 1.5px dashed var(--pink);
  border-radius: 3px;
}
</style>
