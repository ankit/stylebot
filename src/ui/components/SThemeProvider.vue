<template>
  <div class="theme-provider" :data-theme="dataTheme"><slot /></div>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';
import type { StylebotAppearance } from '@stylebot/types';

export default Vue.extend({
  name: 'SThemeProvider',

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
  // Surfaces
  --panel-surface: #1c1e22;
  --card-surface: #1f2026;
  --tab-surface: #141519;
  --chat-surface: #1b1c20;
  --code-surface: #1a1b1e;
  --panel-shadow: rgb(0 0 0 / 34%);

  // Text
  --text-primary: #f2f4f7;
  --text-body: #c3c7ce;
  --text-secondary: #a3aab6;
  --text-muted: #a3aab6;
  --text-faint: #8d95a2;
  --section-heading: #b4b8c0;
  --reading-ink: #d4d6dc;
  --reading-strong: #eceef1;

  // Lines and interaction states
  --panel-border: #2c2f35;
  --hover-tint: #2e3238;
  --active: #2a2d33;
  --icon-color: #9aa1ae;

  // Accent
  --accent-text: #7fa4e1;

  // Text selection
  --selection: #2f4f8f;
  --selection-ink: #f2f4f7;

  // Form fields
  --field-surface: #24262c;
  --field-surface-hover: #2a2c33;
  --field-surface-active: #3a3d46;
  --card-field-surface: #2a2c33;
  --card-field-surface-hover: #33363d;
  --field-ink: #e4e6eb;
  --field-placeholder: #7d838e;
  --field-border: #3a3e46;
  --field-border-hover: #4a4f58;
  --field-border-selector: #3a3e46;
  --field-fill: #15171a;
  --field-divider: #2c2f35;
  --slider-track: #3a3e46;

  // Menus and popovers
  --menu-surface: #23262b;
  --menu-border: #3a3e46;
  --menu-shadow: rgb(0 0 0 / 45%);

  // Pills
  --pill-surface: #26282e;
  --pill-border: #3a3d45;
  --pill-hover: #31343b;

  // Keys
  --key-surface: #33353c;
  --key-outline: transparent;
  --key-edge: #45474f;
  --key-ink: #d1d3d8;

  // Count badges
  --count-badge-surface: #22304d;
  --count-badge-ink: #9dbcff;

  // Status: info
  --info: #1f2740;
  --info-border: #2b3654;

  // Status: danger
  --danger: #f2726a;
  --danger-background: #3a2220;
  --danger-border: #4a2b28;

  // Status: success
  --success: #7fd3a5;
  --success-background: #1e3129;
  --success-border: #2f4d3e;

  // Status: warning
  --warning: #e5b567;
  --warning-icon: #e5b567;
  --warning-background: #2b2518;
  --warning-border: #4a3d22;
}

.theme-provider {
  color-scheme: light dark;
  background: var(--panel-surface);
  color: var(--text-primary);

  // Surfaces
  --panel-surface: #fff;
  --card-surface: #fff;
  --tab-surface: #f7f8fa;
  --chat-surface: #f7f8fa;
  --code-surface: #fcfcfd;
  --panel-shadow: rgb(0 0 0 / 16%);

  // Text
  --text-primary: #191b1f;
  --text-body: #3f434c;
  --text-secondary: #5f6672;
  --text-muted: #6b7280;
  --text-faint: #8b909b;
  --section-heading: #4b5563;
  --reading-ink: #3f434c;
  --reading-strong: #191b1f;

  // Lines and interaction states
  --panel-border: #e9eaee;
  --hover-tint: #f2f3f6;
  --active: #eef0f4;
  --icon-color: #6a7180;

  // Accent
  --accent: #286cd8;
  --accent-ink: #fff;
  --accent-text: var(--accent);

  // Text selection
  --selection: #c7dbff;
  --selection-ink: #191b1f;

  // Form fields
  --field-surface: #f1f2f5;
  --field-surface-hover: #e7e9ee;
  --field-surface-active: #fff;
  --card-field-surface: #f1f2f5;
  --card-field-surface-hover: #e7e9ee;
  --field-ink: #191b1f;
  --field-placeholder: #8f949e;
  --field-border: #dcdfe5;
  --field-border-hover: #b9bec8;
  --field-border-selector: #d3d6dd;
  --field-fill: transparent;
  --field-divider: #ecedf0;
  --slider-track: #e4e7ed;

  // Menus and popovers
  --menu-surface: #fff;
  --menu-border: #e2e4e9;
  --menu-shadow: rgb(0 0 0 / 20%);

  // Pills
  --pill-surface: var(--card-surface);
  --pill-border: var(--field-border-selector);
  --pill-hover: var(--hover-tint);

  // Keys
  --key-surface: #fff;
  --key-outline: #e1e3e8;
  --key-edge: #d9dce1;
  --key-ink: #374151;

  // Count badges
  --count-badge-surface: #e7eefc;
  --count-badge-ink: #24509e;

  // Status: info
  --info: #eef3ff;
  --info-border: #dbe4fb;

  // Status: danger
  --danger: #b3261e;
  --danger-background: #fdf1f0;
  --danger-border: #f6cfcb;

  // Status: success
  --success: #1a7f4b;
  --success-background: #e8f5ee;
  --success-border: #c3e6d1;

  // Status: warning
  --warning: #8a5a00;
  --warning-icon: #e08a00;
  --warning-background: #fff8ec;
  --warning-border: #f1e3c6;

  // Fonts
  --font-mono: 'Geist Mono', Menlo, Monaco, Consolas, monospace;
  --font-reading: 'Literata', Georgia, serif;
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
