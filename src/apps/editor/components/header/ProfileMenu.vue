<template>
  <s-menu dense :min-width="132" class="row-menu" :style="{ top: `${top}px` }">
    <s-menu-item @click="$emit('rename')">{{ t('rename') }}</s-menu-item>
    <s-menu-item @click="$emit('duplicate')">{{ t('duplicate') }}</s-menu-item>
    <s-menu-item v-if="canDelete" danger @click="$emit('delete')">
      {{ t('delete') }}
    </s-menu-item>
  </s-menu>
</template>

<script lang="ts">
import Vue from 'vue';
import { SMenu, SMenuItem } from '@stylebot/components';

/**
 * A profile row's own actions, opened from its •••.
 */
export default Vue.extend({
  name: 'ProfileMenu',

  components: {
    SMenu,
    SMenuItem,
  },

  props: {
    // Offset from the top of the profile menu, just below the row.
    top: {
      type: Number,
      required: true,
    },

    canDelete: Boolean,
  },

  mounted() {
    this.$el.querySelector<HTMLElement>('button')?.focus();
  },
});
</script>

<style lang="scss" scoped>
.row-menu {
  position: absolute;
  right: 4px;
  z-index: 1;
}
</style>
