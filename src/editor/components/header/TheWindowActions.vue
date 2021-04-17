<template>
  <div>
    <the-more-action class="stylebot-window-action more-action" />
    <the-resize-action class="stylebot-window-action resize-action" />
    <the-close-action class="stylebot-window-action close-action" />
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
.stylebot-window-action {
  & .btn-group,
  &.btn-sm,
  & .btn-group > .btn.btn-sm {
    top: 0 !important;
    margin: 0 !important;
    padding: 0 !important;
    height: auto !important;
    border: none !important;
    background: none !important;
    position: absolute !important;

    &:focus {
      box-shadow: none !important;
    }
  }

  &.more-action .btn-group {
    right: 55px !important;
  }

  &.resize-action {
    right: 20px !important;

    &.btn .b-icon {
      font-size: 14px !important;
    }
  }

  &.close-action {
    right: 0 !important;

    &.btn .b-icon {
      font-size: 15px !important;
    }
  }
}
</style>
