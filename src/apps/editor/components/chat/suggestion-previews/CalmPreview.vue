<template>
  <span class="calm">
    <span class="lines">
      <preview-bar :height="4" />
      <preview-bar :width="70" :height="4" :fade="0.4" />
      <preview-bar :width="40" :height="4" :fade="0.2" />
    </span>
  </span>
</template>

<script lang="ts">
import Vue from 'vue';

import PreviewBar from './PreviewBar.vue';

export default Vue.extend({
  name: 'CalmPreview',

  components: {
    PreviewBar,
  },
});
</script>

<style lang="scss" scoped>
.calm {
  --bar: #7a8c9c;

  background: #eef0ee;
}

.lines {
  display: flex;
  flex-direction: column;
  gap: 7px;
  width: 60%;
}
</style>
