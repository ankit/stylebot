<template>
  <s-anchored-menu>
    <template #trigger="{ toggle }">
      <icon-menu-trigger
        :size="size"
        :bordered="bordered"
        :title="t('more_actions')"
        @click="toggle"
      />
    </template>

    <template #default="{ close }">
      <s-menu dense :min-width="160" style="--menu-item-font-size: 14px">
        <s-menu-item
          v-if="$listeners.edit"
          @click="
            $emit('edit');
            close();
          "
        >
          {{ t('edit') }}
        </s-menu-item>

        <s-menu-item
          class="truncate"
          @click="
            $emit('open-site');
            close();
          "
        >
          {{ t('open_url', [url]) }}
        </s-menu-item>

        <s-menu-divider />

        <s-menu-item
          danger
          @click="
            $emit('delete');
            close();
          "
        >
          {{ t('delete') }}
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
  name: 'StyleRowMenu',

  components: {
    SAnchoredMenu,
    IconMenuTrigger,
    SMenu,
    SMenuDivider,
    SMenuItem,
  },

  props: {
    url: {
      type: String,
      required: true,
    },

    size: {
      type: Number,
      default: 30,
    },

    // Outlined, where the menu stands on its own rather than in a row.
    bordered: {
      type: Boolean,
      default: false,
    },
  },
});
</script>

<style lang="scss" scoped>
.truncate {
  @include truncate;

  max-width: 220px;
}
</style>
