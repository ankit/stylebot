<template>
  <div class="pt-2" v-if="optionsLoaded">
    <b-row no-gutters class="mt-5">
      <the-use-shortcut-key />
    </b-row>

    <b-row no-gutters class="mt-3">
      <the-shortcut-key />
    </b-row>

    <b-row no-gutters class="mt-5">
      <the-context-menu />
    </b-row>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import TheShortcutKey from './basics/TheShortcutKey.vue';
import TheContextMenu from './basics/TheContextMenu.vue';
import TheUseShortcutKey from './basics/TheUseShortcutKey.vue';

export default Vue.extend({
  name: 'TheBasicsTab',

  components: {
    TheShortcutKey,
    TheContextMenu,
    TheUseShortcutKey,
  },

  computed: {
    optionsLoaded(): boolean {
      return !!this.$store.state.options;
    },
  },
});
</script>

<style lang="scss">
.shortcut-key-character {
  width: 48px !important;
}

.shortcut-meta-key {
  .dropdown-toggle {
    text-transform: capitalize;
  }
}
</style>
