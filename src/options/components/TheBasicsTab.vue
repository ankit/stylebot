<template>
  <div v-if="optionsLoaded" class="basics-tab">
    <heading as="h1">{{ t('basics_options') }}</heading>

    <the-context-menu />
    <the-appearance />

    <div class="section">
      <the-fonts />
    </div>

    <div class="section">
      <the-keyboard-shortcuts />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import { Heading } from '@stylebot/components';
import TheFonts from './basics/TheFonts.vue';
import TheContextMenu from './basics/TheContextMenu.vue';
import TheAppearance from './basics/TheAppearance.vue';
import TheKeyboardShortcuts from './basics/TheKeyboardShortcuts.vue';

export default Vue.extend({
  name: 'TheBasicsTab',

  components: {
    Heading,
    TheFonts,
    TheContextMenu,
    TheAppearance,
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
  padding: 20px 22px 26px;
}

.section {
  margin-top: 30px;
}
</style>
