<template>
  <span class="read-like-a-book">
    <span class="serif">Aa</span>
    <span class="lines">
      <preview-bar />
      <preview-bar :width="80" />
      <preview-bar :width="90" />
    </span>
  </span>
</template>

<script lang="ts">
import Vue from 'vue';

import PreviewBar from './PreviewBar.vue';

export default Vue.extend({
  name: 'ReadLikeABookPreview',

  components: {
    PreviewBar,
  },
});
</script>

<style lang="scss" scoped>
.read-like-a-book {
  --gap: 8px;
}

.serif {
  font: 500 22px/1 Literata, Georgia, serif;
  color: var(--pink);
}

.lines {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 34%;
}
</style>
