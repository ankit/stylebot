<template>
  <div class="theme-provider" :data-theme="dataTheme"><slot /></div>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';
import type { StylebotAppearance } from '@stylebot/types';

export default Vue.extend({
  name: 'ThemeProvider',

  props: {
    mode: {
      type: String as PropType<StylebotAppearance>,
      default: 'system',
    },
  },

  computed: {
    // Omitted for 'system' so the plain prefers-color-scheme media query
    // below keeps deciding — only a manual light/dark choice sets this.
    dataTheme(): 'light' | 'dark' | undefined {
      return this.mode === 'system' ? undefined : this.mode;
    },
  },
});
</script>

<style lang="scss" scoped>
@mixin dark-theme-vars {
  --panel-surface: #1c1e22;
  --text-primary: #f2f4f7;
  --text-secondary: #a3aab6;
  --text-muted: #a3aab6;
  --text-faint: #8d95a2;
  --panel-border: #2c2f35;
  --hover-tint: #2e3238;
  --active: #2a2d33;

  --accent-text: #7fa4e1;

  --selection: #2f4f8f;
  --selection-ink: #f2f4f7;

  --field-border: #3a3e46;
  --field-border-hover: #4a4f58;
  --field-border-selector: #3a3e46;
  --field-fill: #15171a;
  --field-divider: #2c2f35;
  --slider-track: #3a3e46;
  --icon-color: #9aa1ae;

  --card-surface: #212429;
  --tab-surface: #181a1e;
  --raised-surface: #000;
  --panel-shadow: rgb(0 0 0 / 34%);

  --menu-surface: #23262b;
  --menu-border: #3a3e46;
  --menu-shadow: rgb(0 0 0 / 45%);

  --info: #1f2740;
  --info-border: #2b3654;

  --danger: #f2726a;
  --danger-background: #3a2220;
  --danger-border: #4a2b28;

  --success: #7fd3a5;
  --success-background: #1e3129;
  --success-border: #2f4d3e;
}

.theme-provider {
  color-scheme: light dark;
  background: var(--panel-surface);
  color: var(--text-primary);

  --panel-surface: #fff;
  --text-primary: #191b1f;
  --text-secondary: #5f6672;
  --text-muted: #6b7280;
  --text-faint: #8b909b;
  --panel-border: #e9eaee;
  --hover-tint: #f2f3f6;
  --active: #eef0f4;

  --accent: #286cd8;
  --accent-ink: #fff;
  --accent-text: var(--accent);

  --selection: #c7dbff;
  --selection-ink: #191b1f;

  --field-border: #dcdfe5;
  --field-border-hover: #b9bec8;
  --field-border-selector: #d3d6dd;
  --field-fill: transparent;
  --field-divider: #ecedf0;
  --slider-track: #e4e7ed;
  --icon-color: #6a7180;

  --card-surface: #fff;
  --tab-surface: #f7f8fa;
  --raised-surface: #fff;
  --panel-shadow: rgb(0 0 0 / 16%);

  --menu-surface: #fff;
  --menu-border: #e2e4e9;
  --menu-shadow: rgb(0 0 0 / 20%);

  --info: #eef3ff;
  --info-border: #dbe4fb;

  --danger: #b3261e;
  --danger-background: #fdf1f0;
  --danger-border: #f6cfcb;

  --success: #1a7f4b;
  --success-background: #e8f5ee;
  --success-border: #c3e6d1;

  --ring: var(--accent);

  --font-mono: 'Fira Code', Menlo, Monaco, Consolas, monospace;
}

.theme-provider ::v-deep ::selection {
  background: var(--selection);
  color: var(--selection-ink);
}

@media (prefers-color-scheme: dark) {
  .theme-provider:not([data-theme]) {
    @include dark-theme-vars;
  }
}

.theme-provider[data-theme='dark'] {
  @include dark-theme-vars;
}
</style>
