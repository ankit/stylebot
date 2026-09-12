<template>
  <anchored-menu class="more-action-anchor">
    <template #trigger="{ toggle }">
      <icon-button :size="24" :title="t('view_options')" @click="toggle">
        <more-icon />
      </icon-button>
    </template>

    <template #default="{ close }">
      <s-menu class="more-menu">
        <div class="dock-toggle" role="group">
          <button
            type="button"
            class="dock-option"
            :class="{ active: !dockedRight }"
            :title="`${t('dock_to_left')} (${editorCommands.dockLeft})`"
            @click="dockToLeft(); close();"
          >
            {{ t('dock_to_left') }}
          </button>

          <button
            type="button"
            class="dock-option"
            :class="{ active: dockedRight }"
            :title="`${t('dock_to_right')} (r)`"
            @click="dockToRight(); close();"
          >
            {{ t('dock_to_right') }}
          </button>
        </div>

        <div class="push-page-row">
          <div class="push-page-copy">
            <div class="push-page-title">{{ t('adjust_page_layout') }}</div>
            <div class="push-page-description">{{ t('adjust_page_layout_description') }}</div>
          </div>

          <toggle-switch :value="adjustPageLayout" size="lg" @change="toggleAdjustPageLayout" />
        </div>

        <hr class="more-menu-divider" />

        <menu-item @click="keyboardShortcuts(); close();">
          <span class="menu-item-row">
            <span>{{ t('view_keyboard_shortcuts') }}</span>
            <span class="menu-item-hint">{{ editorCommands.help }}</span>
          </span>
        </menu-item>

        <menu-item @click="optionsPage(); close();">
          <span class="menu-item-row">
            <span>{{ t('view_all_styles_and_settings') }}</span>
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 2.5h5.5V8M9.5 2.5 3 9" />
            </svg>
          </span>
        </menu-item>
      </s-menu>
    </template>
  </anchored-menu>
</template>

<script lang="ts">
import Vue from 'vue';
import { AnchoredMenu, SMenu, MenuItem, IconButton, ToggleSwitch } from '@stylebot/components';
import { MoreIcon } from '@stylebot/icons';

import { StylebotEditorCommands, StylebotLayout } from '@stylebot/types';

import { openOptionsPage } from '../../utils/chrome';

export default Vue.extend({
  name: 'TheMoreAction',

  components: {
    AnchoredMenu,
    SMenu,
    MenuItem,
    IconButton,
    ToggleSwitch,
    MoreIcon,
  },

  computed: {
    layout(): StylebotLayout {
      return this.$store.state.options.layout;
    },

    editorCommands(): StylebotEditorCommands {
      return this.$store.state.editorCommands;
    },

    dockedRight(): boolean {
      return this.layout.dockLocation === 'right';
    },

    adjustPageLayout(): boolean {
      return this.layout.adjustPageLayout;
    },
  },

  methods: {
    dockToRight(): void {
      this.$store.dispatch('setLayout', {
        ...this.layout,
        dockLocation: 'right',
      });
    },

    dockToLeft(): void {
      this.$store.dispatch('setLayout', {
        ...this.layout,
        dockLocation: 'left',
      });
    },

    toggleAdjustPageLayout(): void {
      this.$store.dispatch('setLayout', {
        ...this.layout,
        adjustPageLayout: !this.adjustPageLayout,
      });
    },

    keyboardShortcuts(): void {
      this.$store.commit('setHelp', true);
    },

    optionsPage(): void {
      openOptionsPage();
    },
  },
});
</script>

<style lang="scss" scoped>
.more-menu {
  width: 250px;
  padding: 11px 12px 10px !important;
  gap: 0 !important;
}

.dock-toggle {
  display: flex;
  gap: 2px;
  padding: 2px;
  border-radius: 8px;
  background: var(--accent);
}

.dock-option {
  flex: 1;
  text-align: center;
  padding: 6px 0;
  border: none;
  border-radius: 6px;
  background: none;
  font-family: inherit;
  font-size: 12px;
  color: var(--muted-foreground);
  cursor: pointer;

  &.active {
    font-weight: 600;
    color: var(--foreground);
    background: var(--background);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }

  &:focus-visible {
    outline: 2px solid var(--ring);
    outline-offset: -2px;
  }
}

.push-page-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin: 11px 0 5px;

  ::v-deep .switch {
    width: auto;
    margin-top: 2px;
  }
}

.push-page-copy {
  flex: 1;
  min-width: 0;
}

.push-page-title {
  font-size: 12.5px;
  color: var(--foreground);
}

.push-page-description {
  font-size: 11px;
  line-height: 1.4;
  color: var(--muted-foreground);
  margin-top: 2px;
}

.more-menu-divider {
  margin: 10px -12px;
  border: none;
  border-top: 1px solid var(--border);
}

.menu-item-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
}

.menu-item-hint {
  font-family: Menlo, Monaco, Consolas, monospace;
  font-size: 11px;
  color: var(--muted-foreground);
}
</style>
