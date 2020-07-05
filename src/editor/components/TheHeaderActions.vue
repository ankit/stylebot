<template>
  <div class="mr-3">
    <the-options-action class="header-action" />
    <the-move-action class="header-action" />
    <the-close-action class="header-action" />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import TheCloseAction from './header-actions/TheCloseAction.vue';
import TheMoveAction from './header-actions/TheMoveAction.vue';
import TheOptionsAction from './header-actions/TheOptionsAction.vue';

export default Vue.extend({
  name: 'TheHeaderActions',

  components: {
    TheCloseAction,
    TheMoveAction,
    TheOptionsAction,
  },
});
</script>

<style lang="scss" scoped>
.header-action {
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  margin-left: 2px;
}
</style>
