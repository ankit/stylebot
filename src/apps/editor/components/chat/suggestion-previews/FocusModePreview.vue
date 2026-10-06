<template>
  <span class="focus-mode">
    <span class="lines side">
      <preview-bar />
      <preview-bar :width="70" />
    </span>
    <span class="lines main">
      <preview-bar accent />
      <preview-bar accent :width="80" />
      <preview-bar accent :width="90" />
    </span>
    <span class="lines side">
      <preview-bar />
      <preview-bar :width="70" />
    </span>
  </span>
</template>

<script lang="ts">
import Vue from 'vue';

import PreviewBar from './PreviewBar.vue';

export default Vue.extend({
  name: 'FocusModePreview',

  components: {
    PreviewBar,
  },
});
</script>

<style lang="scss" scoped>
.focus-mode {
  --bar-accent: var(--green);
  --gap: 5px;
}

.lines {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.side {
  width: 16%;
  opacity: 0.35;
}

.main {
  width: 36%;
}
</style>
