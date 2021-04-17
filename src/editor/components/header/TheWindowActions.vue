<template>
  <div>
    <the-dock-action class="window-action dock-action" />
    <the-resize-action class="window-action resize-action" />
    <the-close-action class="window-action close-action" />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import TheDockAction from './TheDockAction.vue';
import TheCloseAction from './TheCloseAction.vue';
import TheResizeAction from './TheResizeAction.vue';

export default Vue.extend({
  name: 'TheWindowActions',

  components: {
    TheDockAction,
    TheCloseAction,
    TheResizeAction,
  },
});
</script>

<style lang="scss" scoped>
.window-action {
  top: 0;
  margin: 0;
  padding: 0;
  border: none;
  font-size: 15px;
  background: none;
  position: absolute;

  &.dock-action {
    right: 40px;
  }

  &.resize-action {
    right: 20px;
    font-size: 14px;
  }

  &.close-action {
    right: 0;
  }
}
</style>
