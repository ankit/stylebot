<template>
  <div class="stylebot-header-actions">
    <the-options-action class="stylebot-header-action-btn" />
    <the-move-action class="stylebot-header-action-btn" />
    <the-close-action class="stylebot-header-action-btn" />
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

<style scoped>
.stylebot-header-actions {
  margin-right: 15px;
}

.stylebot-header-action-btn {
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  margin-left: 2px;
}
</style>
