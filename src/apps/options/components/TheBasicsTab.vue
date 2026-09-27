<template>
  <div v-if="optionsLoaded" class="basics-tab">
    <s-heading as="h1" size="xl">{{ t('basics_options') }}</s-heading>

    <the-context-menu />

    <div class="section">
      <the-keyboard-shortcuts />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import { SHeading } from '@stylebot/components';
import TheContextMenu from './basics/TheContextMenu.vue';
import TheKeyboardShortcuts from './basics/TheKeyboardShortcuts.vue';

export default Vue.extend({
  name: 'TheBasicsTab',

  components: {
    SHeading,
    TheContextMenu,
    TheKeyboardShortcuts,
  },

  computed: {
    optionsLoaded(): boolean {
      return !!this.$store.state.options;
    },
  },
});
</script>

<style lang="scss" scoped>
.basics-tab {
  max-width: 760px;
  padding: 20px 22px 26px;
}

.section {
  margin-top: 40px;
}
</style>
