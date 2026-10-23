<template>
  <div v-if="optionsLoaded" class="basics-tab">
    <s-heading as="h1" size="xl">{{ t('basics_options') }}</s-heading>

    <s-list>
      <the-theme />
      <the-position />
      <the-context-menu />
      <the-gallery-suggestions />
    </s-list>

    <the-cli-access v-if="showCliAccess" />

    <the-keyboard-shortcuts />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import { SHeading, SList } from '@stylebot/components';
import { supportsCLI } from '@stylebot/settings';
import TheTheme from './basics/TheTheme.vue';
import ThePosition from './basics/ThePosition.vue';
import TheContextMenu from './basics/TheContextMenu.vue';
import TheGallerySuggestions from './basics/TheGallerySuggestions.vue';
import TheCliAccess from './basics/TheCliAccess.vue';
import TheKeyboardShortcuts from './basics/TheKeyboardShortcuts.vue';

export default Vue.extend({
  name: 'TheBasicsTab',

  components: {
    SHeading,
    SList,
    TheTheme,
    ThePosition,
    TheContextMenu,
    TheGallerySuggestions,
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
  display: flex;
  flex-direction: column;
  gap: 40px;
  max-width: 860px;
  padding: 20px 22px 26px;
}
</style>
