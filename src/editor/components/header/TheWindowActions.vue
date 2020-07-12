<template>
  <div class="mr-3">
    <the-options-action class="window-action" />
    <the-move-action class="window-action" />
    <the-close-action class="window-action" />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import TheCloseAction from './TheCloseAction.vue';
import TheMoveAction from './TheMoveAction.vue';
import TheOptionsAction from './TheOptionsAction.vue';

export default Vue.extend({
  name: 'TheWindowActions',

  components: {
    TheCloseAction,
    TheMoveAction,
    TheOptionsAction,
  },
});
</script>

<style lang="scss" scoped>
.window-action {
  margin: 0;
  padding: 0;
  border: none;
  font-size: 18px;
  line-height: 21px;
  background: none;
}
</style>
