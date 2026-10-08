<template>
  <div v-if="optionsLoaded" class="basics-tab">
    <s-heading as="h1" size="xl">{{ t('basics_options') }}</s-heading>

    <the-theme />
    <the-context-menu />
    <the-cli-access v-if="showCliAccess" />

    <div class="section">
      <the-keyboard-shortcuts />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import { SHeading } from '@stylebot/components';
import { supportsCLI } from '@stylebot/settings';
import TheTheme from './basics/TheTheme.vue';
import TheContextMenu from './basics/TheContextMenu.vue';
import TheCliAccess from './basics/TheCliAccess.vue';
import TheKeyboardShortcuts from './basics/TheKeyboardShortcuts.vue';

export default Vue.extend({
  name: 'TheBasicsTab',

  components: {
    SHeading,
    TheTheme,
    TheContextMenu,
    TheCliAccess,
    TheKeyboardShortcuts,
  },

  computed: {
    showCliAccess(): boolean {
      return supportsCLI();
    },

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
