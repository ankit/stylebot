<template>
  <span class="links-in-color">
    <span class="lines">
      <span class="row">
        <preview-bar :width="34" />
        <preview-bar accent :width="40" />
      </span>
      <preview-bar :width="86" />
      <span class="row">
        <preview-bar accent :width="26" />
        <preview-bar :width="44" />
      </span>
    </span>
  </span>
</template>

<script lang="ts">
import Vue from 'vue';

import PreviewBar from './PreviewBar.vue';

export default Vue.extend({
  name: 'LinksInColorPreview',

  components: {
    PreviewBar,
  },
});
</script>

<style lang="scss" scoped>
.links-in-color {
  --bar: #bdbdbd;
  --bar-accent: #2563eb;

  background: #fff;
}

.lines {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 66%;
}

.row {
  display: flex;
  gap: 3px;
}
</style>
