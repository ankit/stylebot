<template>
  <anchored-menu>
    <template #trigger="{ toggle }">
      <icon-menu-trigger :size="38" title="More actions" @click="toggle" />
    </template>

    <template #default="{ close }">
      <s-menu dense :min-width="176">
        <menu-item
          @click="
            $emit('enable-all');
            close();
          "
        >
          Enable all
        </menu-item>

        <menu-item
          @click="
            $emit('disable-all');
            close();
          "
        >
          Disable all
        </menu-item>

        <div class="divider" />

        <menu-item
          danger
          @click="
            $emit('delete-all');
            close();
          "
        >
          Delete all styles
        </menu-item>
      </s-menu>
    </template>
  </anchored-menu>
</template>

<script lang="ts">
import Vue from 'vue';

import { AnchoredMenu, SMenu, MenuItem } from '@stylebot/components';
import IconMenuTrigger from '../IconMenuTrigger.vue';

export default Vue.extend({
  name: 'StylesBulkMenu',

  components: {
    AnchoredMenu,
    IconMenuTrigger,
    SMenu,
    MenuItem,
  },
});
</script>

<style lang="scss" scoped>
.divider {
  height: 1px;
  background: var(--border);
  margin: 5px 10px;
}
</style>
