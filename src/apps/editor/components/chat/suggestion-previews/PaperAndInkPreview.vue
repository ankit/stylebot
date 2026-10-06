<template>
  <span class="paper-and-ink">
    <span class="page">
      <preview-bar :height="2" />
      <preview-bar :width="80" :height="2" />
      <preview-bar accent :width="60" :height="2" />
      <preview-bar :width="90" :height="2" />
    </span>
  </span>
</template>

<script lang="ts">
import Vue from 'vue';

import PreviewBar from './PreviewBar.vue';

export default Vue.extend({
  name: 'PaperAndInkPreview',

  components: {
    PreviewBar,
  },
});
</script>

<style lang="scss" scoped>
.paper-and-ink {
  --bar: #2b2a27;
  --bar-accent: #8a6a4a;

  background: #e6dcc4;
}

.page {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 3px;
  width: 30px;
  height: 38px;
  padding: 0 5px;
  box-sizing: border-box;
  border-radius: 3px;
  background: #faf6ec;
  box-shadow: 0 3px 6px rgb(60 40 20 / 18%);
  transform: rotate(-6deg);
}
</style>
