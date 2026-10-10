<template>
  <s-anchored-menu>
    <template #trigger="{ toggle }">
      <icon-menu-trigger
        :size="36"
        :title="t('more_actions')"
        @click="toggle"
      />
    </template>

    <template #default="{ close }">
      <s-menu dense :min-width="160" style="--menu-item-font-size: 14px">
        <s-menu-item
          @click="
            $emit('enable-all');
            close();
          "
        >
          {{ t('enable_all_styles') }}
        </s-menu-item>

        <s-menu-item
          @click="
            $emit('disable-all');
            close();
          "
        >
          {{ t('disable_all_styles') }}
        </s-menu-item>

        <s-menu-divider />

        <s-menu-item
          danger
          @click="
            $emit('delete-all');
            close();
          "
        >
          {{ t('delete_all_styles') }}
        </s-menu-item>
      </s-menu>
    </template>
  </s-anchored-menu>
</template>

<script lang="ts">
import Vue from 'vue';

import {
  SAnchoredMenu,
  SMenu,
  SMenuDivider,
  SMenuItem,
} from '@stylebot/components';
import IconMenuTrigger from '../IconMenuTrigger.vue';

export default Vue.extend({
  name: 'StylesBulkMenu',

  components: {
    SAnchoredMenu,
    IconMenuTrigger,
    SMenu,
    SMenuDivider,
    SMenuItem,
  },
});
</script>
