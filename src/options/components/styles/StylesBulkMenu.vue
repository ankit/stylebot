<template>
  <anchored-menu>
    <template #trigger="{ toggle }">
      <icon-menu-trigger :size="38" title="More actions" @click="toggle" />
    </template>

    <template #default="{ close }">
      <menu-box dense :min-width="176">
        <button
          type="button"
          class="row"
          role="menuitem"
          @click="
            $emit('enable-all');
            close();
          "
        >
          Enable all
        </button>

        <button
          type="button"
          class="row"
          role="menuitem"
          @click="
            $emit('disable-all');
            close();
          "
        >
          Disable all
        </button>

        <div class="divider" />

        <button
          type="button"
          class="row danger"
          role="menuitem"
          @click="
            $emit('delete-all');
            close();
          "
        >
          Delete all styles
        </button>
      </menu-box>
    </template>
  </anchored-menu>
</template>

<script lang="ts">
import Vue from 'vue';

import { MenuBox } from '@stylebot/components';
import AnchoredMenu from '../AnchoredMenu.vue';
import IconMenuTrigger from '../IconMenuTrigger.vue';

export default Vue.extend({
  name: 'StylesBulkMenu',

  components: {
    AnchoredMenu,
    IconMenuTrigger,
    MenuBox,
  },
});
</script>

<style lang="scss" scoped>
.row {
  all: unset;
  box-sizing: border-box;
  display: block;
  width: 100%;
  font-weight: 400;
  font-size: 13.5px;
  line-height: 1.3;
  color: var(--ui-fg);
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;

  &:hover {
    background: var(--ui-hover-bg);
  }

  &.danger {
    color: #b3261e;

    &:hover {
      background: #fdf1f0;
    }
  }
}

.divider {
  height: 1px;
  background: var(--ui-border);
  margin: 5px 10px;
}
</style>
