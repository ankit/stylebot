<template>
  <span class="hide-sidebar">
    <span class="split">
      <span class="lines">
        <preview-bar />
        <preview-bar :width="80" />
        <preview-bar :width="90" />
      </span>
      <span class="removed" />
    </span>
  </span>
</template>

<script lang="ts">
import Vue from 'vue';

import PreviewBar from './PreviewBar.vue';

export default Vue.extend({
  name: 'HideSidebarPreview',

  components: {
    PreviewBar,
  },
});
</script>

<style lang="scss" scoped>
.split {
  display: flex;
  align-items: stretch;
  gap: 4px;
  width: 70%;
  height: 30px;
}

.lines {
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
}

.removed {
  width: 16px;
  box-sizing: border-box;
  border: 1.5px dashed var(--pink);
  border-radius: 3px;
}
</style>
