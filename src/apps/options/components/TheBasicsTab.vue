<template>
  <div v-if="optionsLoaded" class="basics-tab">
    <s-heading as="h1" size="xl">{{ t('basics_options') }}</s-heading>

    <s-list class="settings">
      <the-theme />
      <the-context-menu />
      <the-cli-access v-if="showCliAccess" />
    </s-list>

    <the-keyboard-shortcuts class="section" />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import { SHeading, SList } from '@stylebot/components';
import { supportsCLI } from '@stylebot/settings';
import TheTheme from './basics/TheTheme.vue';
import TheContextMenu from './basics/TheContextMenu.vue';
import TheCliAccess from './basics/TheCliAccess.vue';
import TheKeyboardShortcuts from './basics/TheKeyboardShortcuts.vue';

export default Vue.extend({
  name: 'TheBasicsTab',

  components: {
    SHeading,
    SList,
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
  max-width: 860px;
  padding: 20px 22px 26px;
}

.settings {
  margin-top: 24px;
}

.section {
  margin-top: 48px;
}
</style>
