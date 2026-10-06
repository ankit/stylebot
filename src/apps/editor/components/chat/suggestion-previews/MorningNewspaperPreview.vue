<template>
  <span class="morning-newspaper">
    <span v-for="column in 3" :key="column" class="column">
      <preview-bar accent :height="column === 1 ? 4 : 2" />
      <preview-bar :width="80" :height="2" />
      <preview-bar :width="90" :height="2" />
      <preview-bar :width="60" :height="2" />
    </span>
  </span>
</template>

<script lang="ts">
import Vue from 'vue';

import PreviewBar from './PreviewBar.vue';

export default Vue.extend({
  name: 'MorningNewspaperPreview',

  components: {
    PreviewBar,
  },
});
</script>

<style lang="scss" scoped>
.morning-newspaper {
  --bar: #9b9383;
  --bar-accent: #161513;
  --bar-radius: 0;

  --gap: 5px;
  padding: 0 10px;
  background: #f2ead8;
}

.column {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 3px;

  & + & {
    padding-left: 5px;
    border-left: 1px solid #b9b09c;
  }
}
</style>
