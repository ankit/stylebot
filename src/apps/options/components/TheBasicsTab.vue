<template>
  <div v-if="optionsLoaded" class="basics-tab">
    <s-heading as="h1" size="xl">{{ t('basics_options') }}</s-heading>

    <s-list>
      <the-theme />
      <the-position v-if="supportsEditor" />
      <the-context-menu v-if="supportsEditor" />
      <the-active-style-badge v-if="showActiveStyleBadge" />
      <the-gallery-suggestions />
    </s-list>

    <the-cli-access v-if="showCliAccess" />

    <the-keyboard-shortcuts v-if="supportsEditor" />
  </div>
</template>

<script lang="ts">
import { SHeading, SList } from '@stylebot/components';
import { supportsCLI } from '@stylebot/settings';
import { isSafari } from '@stylebot/utils';
import TheTheme from './basics/TheTheme.vue';
import ThePosition from './basics/ThePosition.vue';
import TheContextMenu from './basics/TheContextMenu.vue';
import TheActiveStyleBadge from './basics/TheActiveStyleBadge.vue';
import TheGallerySuggestions from './basics/TheGallerySuggestions.vue';
import TheCliAccess from './basics/TheCliAccess.vue';
import TheKeyboardShortcuts from './basics/TheKeyboardShortcuts.vue';
import { OptionsVue } from '../options-vue';

export default OptionsVue.extend({
  name: 'TheBasicsTab',

  components: {
    SHeading,
    SList,
    TheTheme,
    ThePosition,
    TheContextMenu,
    TheActiveStyleBadge,
    TheGallerySuggestions,
    TheCliAccess,
    TheKeyboardShortcuts,
  },

  computed: {
    showCliAccess(): boolean {
      return supportsCLI();
    },

    showActiveStyleBadge(): boolean {
      return !isSafari();
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
  padding: var(--options-tab-padding, 20px 22px 26px);
}
</style>
