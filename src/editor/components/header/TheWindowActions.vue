<template>
  <div class="window-actions">
    <the-more-action class="more-action" />
    <the-resize-action />
    <the-close-action />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import TheMoreAction from './TheMoreAction.vue';
// import TheDockAction from './TheDockAction.vue';
import TheCloseAction from './TheCloseAction.vue';
import TheResizeAction from './TheResizeAction.vue';

export default Vue.extend({
  name: 'TheWindowActions',

  components: {
    TheMoreAction,
    // TheDockAction,
    TheCloseAction,
    TheResizeAction,
  },
});
</script>

<style lang="scss">
.window-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.window-actions .more-action .btn-group {
  height: 32px;

  .btn {
    height: 100%;
    border: none !important;
    background: none !important;

    &:focus {
      box-shadow: none !important;
    }
  }

  .b-icon {
    font-size: 14px !important;
  }
}
</style>
