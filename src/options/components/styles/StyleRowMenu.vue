<template>
  <anchored-menu>
    <template #trigger="{ toggle }">
      <icon-menu-trigger :size="size" :bordered="false" title="More actions" @click="toggle" />
    </template>

    <template #default="{ close }">
      <menu-box dense :min-width="200">
        <button
          type="button"
          class="row"
          role="menuitem"
          @click="
            $emit('open-site');
            close();
          "
        >
          Open {{ url }}
        </button>

        <button
          type="button"
          class="row"
          role="menuitem"
          @click="
            $emit('copy-css');
            close();
          "
        >
          Copy CSS
        </button>

        <div class="divider" />

        <button
          type="button"
          class="row danger"
          role="menuitem"
          @click="
            $emit('delete');
            close();
          "
        >
          Delete this site's style
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
  name: 'StyleRowMenu',

  components: {
    AnchoredMenu,
    IconMenuTrigger,
    MenuBox,
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
.row {
  all: unset;
  box-sizing: border-box;
  display: block;
  width: 100%;
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 400;
  font-size: 13.5px;
  line-height: 1.3;
  color: var(--foreground);
  padding: 10px;
  border-radius: 8px;
  cursor: pointer;

  &:hover {
    background: var(--accent);
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
  background: var(--border);
  margin: 5px 10px;
}
</style>
