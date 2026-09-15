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
  --background: #1c1d21;
  --foreground: #eceef2;
  --foreground-secondary: #c7cad3;
  --muted-foreground: #7d838f;
  --border: #2c2e34;
  --accent: #26282e;
  --active: #2b2d34;

  --primary: #4d80f0;

  --input: #34363d;
  --icon-foreground: #9aa1ae;

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
  --foreground-secondary: #3f434c;
  --muted-foreground: #767676;
  --border: #e9eaee;
  --accent: #f2f3f6;
  --active: #eceef2;

  --primary: #2a5fd6;

  --input: #dfe1e6;
  --icon-foreground: #6a7180;

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
