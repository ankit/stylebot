<template>
  <s-anchored-menu>
    <template #trigger="{ toggle }">
      <icon-menu-trigger :size="38" title="More actions" @click="toggle" />
    </template>

    <template #default="{ close }">
      <s-menu dense :min-width="176">
        <s-menu-item
          @click="
            $emit('enable-all');
            close();
          "
        >
          Enable all
        </s-menu-item>

        <s-menu-item
          @click="
            $emit('disable-all');
            close();
          "
        >
          Disable all
        </s-menu-item>

        <div class="divider" />

        <s-menu-item
          danger
          @click="
            $emit('delete-all');
            close();
          "
        >
          Delete all styles
        </s-menu-item>
      </s-menu>
    </template>
  </s-anchored-menu>
</template>

<script lang="ts">
import Vue from 'vue';

import { SAnchoredMenu, SMenu, SMenuItem } from '@stylebot/components';
import IconMenuTrigger from '../IconMenuTrigger.vue';

export default Vue.extend({
  name: 'StylesBulkMenu',

  components: {
    SAnchoredMenu,
    IconMenuTrigger,
    SMenu,
    SMenuItem,
  },
});
</script>

<style lang="scss" scoped>
.divider {
  height: 1px;
  background: var(--panel-border);
  margin: 5px 10px;
}
</style>
