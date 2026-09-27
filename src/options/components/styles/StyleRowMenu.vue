<template>
  <s-anchored-menu>
    <template #trigger="{ toggle }">
      <icon-menu-trigger
        :size="size"
        :bordered="false"
        title="More actions"
        @click="toggle"
      />
    </template>

    <template #default="{ close }">
      <s-menu dense :min-width="200">
        <s-menu-item
          class="truncate"
          @click="
            $emit('open-site');
            close();
          "
        >
          Open {{ url }}
        </s-menu-item>

        <s-menu-item
          @click="
            $emit('copy-css');
            close();
          "
        >
          Copy CSS
        </s-menu-item>

        <div class="divider" />

        <s-menu-item
          danger
          @click="
            $emit('delete');
            close();
          "
        >
          Delete this site's style
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
  name: 'StyleRowMenu',

  components: {
    SAnchoredMenu,
    IconMenuTrigger,
    SMenu,
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
  },
});
</script>

<style lang="scss" scoped>
.truncate {
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.divider {
  height: 1px;
  background: var(--panel-border);
  margin: 5px 10px;
}
</style>
