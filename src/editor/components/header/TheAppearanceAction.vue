<template>
  <anchored-menu class="appearance-action-anchor">
    <template #trigger="{ toggle }">
      <s-tooltip :text="t('panel_appearance')">
        <icon-button :size="20" @click="toggle">
          <sun-icon v-if="resolvedTheme === 'light'" />
          <moon-icon v-else />
        </icon-button>
      </s-tooltip>
    </template>

    <template #default="{ close }">
      <s-menu dense class="appearance-menu">
        <menu-item :selected="appearance === 'light'" @click="setAppearance('light'); close();">
          <span class="menu-item-row"><sun-icon /><span>{{ t('appearance_light') }}</span></span>
        </menu-item>

        <menu-item :selected="appearance === 'dark'" @click="setAppearance('dark'); close();">
          <span class="menu-item-row"><moon-icon /><span>{{ t('appearance_dark') }}</span></span>
        </menu-item>

        <menu-item :selected="appearance === 'system'" @click="setAppearance('system'); close();">
          <span class="menu-item-row"><monitor-icon /><span>{{ t('appearance_system') }}</span></span>
        </menu-item>
      </s-menu>
    </template>
  </anchored-menu>
</template>

<script lang="ts">
import Vue from 'vue';
import { AnchoredMenu, SMenu, MenuItem, IconButton, STooltip } from '@stylebot/components';
import { SunIcon, MoonIcon, MonitorIcon } from '@stylebot/icons';
import { resolveAppearance, getSystemPreference } from '@stylebot/utils';

import { StylebotAppearance } from '@stylebot/types';

export default Vue.extend({
  name: 'TheAppearanceAction',

  components: {
    AnchoredMenu,
    SMenu,
    MenuItem,
    IconButton,
    STooltip,
    SunIcon,
    MoonIcon,
    MonitorIcon,
  },

  data(): { systemPreference: 'light' | 'dark'; mql: MediaQueryList | null } {
    return {
      systemPreference: getSystemPreference(),
      mql: null,
    };
  },

  computed: {
    appearance(): StylebotAppearance {
      return this.$store.state.options.appearance;
    },

    // What the trigger button's own icon should show — resolves 'system'
    // against the OS's current setting, since there's nothing else to show.
    resolvedTheme(): 'light' | 'dark' {
      return resolveAppearance(this.appearance, this.systemPreference);
    },
  },

  mounted() {
    this.mql = window.matchMedia('(prefers-color-scheme: dark)');
    this.mql.addEventListener('change', this.onSystemThemeChange);
  },

  beforeDestroy() {
    this.mql?.removeEventListener('change', this.onSystemThemeChange);
  },

  methods: {
    onSystemThemeChange(event: MediaQueryListEvent): void {
      this.systemPreference = event.matches ? 'dark' : 'light';
    },

    setAppearance(appearance: StylebotAppearance): void {
      this.$store.dispatch('setAppearance', appearance);
    },
  },
});
</script>

<style lang="scss" scoped>
.appearance-menu {
  width: 168px;
}

.menu-item-row {
  display: flex;
  align-items: center;
  gap: 9px;
}
</style>
