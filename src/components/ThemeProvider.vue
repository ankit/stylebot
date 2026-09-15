<template>
  <div class="theme-provider" :data-theme="dataTheme"><slot /></div>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue';
import { StylebotAppearance } from '@stylebot/types';

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
  --background: #1c1e22;
  --foreground: #f2f4f7;
  --foreground-secondary: #a3aab6;
  --muted-foreground: #a3aab6;
  --text-faint: #8d95a2;
  --border: #2c2f35;
  --accent: #2e3238;
  --active: #2a2d33;

  --primary: #3d7bff;
  --ink-on-accent: #0f1114;
  --accent-tint: #1e2a44;
  --accent-tint-ink: #8ab0ff;

  --input: #3a3e46;
  --input-hover: #4a4f58;
  --input-selector: #3a3e46;
  --field-fill: #15171a;
  --unit-divider: #2c2f35;
  --track: #3a3e46;
  --icon-foreground: #9aa1ae;

  --card-surface: #212429;
  --tab-wash: #181a1e;
  --panel-shadow: rgb(0 0 0 / 34%);

  --menu-surface: #23262b;
  --menu-border: #3a3e46;
  --menu-shadow: rgb(0 0 0 / 45%);

  --info: #1f2740;
  --info-border: #2b3654;

  --danger: #f2726a;
  --danger-background: #3a2220;
  --danger-border: #4a2b28;
}

.theme-provider {
  color-scheme: light dark;
  background: var(--background);
  color: var(--foreground);

  --background: #fff;
  --foreground: #191b1f;
  --foreground-secondary: #5f6672;
  --muted-foreground: #6b7280;
  --text-faint: #8b909b;
  --border: #e9eaee;
  --accent: #f2f3f6;
  --active: #eef0f4;

  --primary: #2a5fd6;
  --ink-on-accent: #fff;
  --accent-tint: #f4f7fe;
  --accent-tint-ink: #2a5fd6;

  --input: #dcdfe5;
  --input-hover: #b9bec8;
  --input-selector: #d3d6dd;
  --field-fill: transparent;
  --unit-divider: #ecedf0;
  --track: #e4e7ed;
  --icon-foreground: #6a7180;

  --card-surface: #fff;
  --tab-wash: #f7f8fa;
  --panel-shadow: rgb(0 0 0 / 16%);

  --menu-surface: #fff;
  --menu-border: #e2e4e9;
  --menu-shadow: rgb(0 0 0 / 20%);

  --info: #eef3ff;
  --info-border: #dbe4fb;

  --danger: #b3261e;
  --danger-background: #fdf1f0;
  --danger-border: #f6cfcb;

  --ring: var(--primary);

  --font-mono: 'Fira Code', Menlo, Monaco, Consolas, monospace;
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
