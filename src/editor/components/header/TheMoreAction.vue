<template>
  <anchored-menu class="more-action-anchor">
    <template #trigger="{ toggle }">
      <icon-button :size="24" :title="t('view_options')" @click="toggle">
        <more-icon />
      </icon-button>
    </template>

    <template #default="{ close }">
      <s-menu class="more-menu">
        <s-segmented-control
          class="dock-toggle"
          :value="layout.dockLocation"
          :options="dockOptions"
          @change="dock($event); close();"
        />

        <div class="push-page-row">
          <div class="push-page-copy">
            <s-text>{{ t('adjust_page_layout') }}</s-text>
            <s-text size="caption" variant="muted">{{ t('adjust_page_layout_description') }}</s-text>
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
            <external-link-icon />
          </span>
        </menu-item>
      </s-menu>
    </template>
  </anchored-menu>
</template>

<script lang="ts">
import Vue from 'vue';
import {
  AnchoredMenu,
  SMenu,
  MenuItem,
  IconButton,
  ToggleSwitch,
  SSegmentedControl,
  SText,
} from '@stylebot/components';
import { MoreIcon, ExternalLinkIcon } from '@stylebot/icons';

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
    SSegmentedControl,
    SText,
    MoreIcon,
    ExternalLinkIcon,
  },

  computed: {
    layout(): StylebotLayout {
      return this.$store.state.options.layout;
    },

    editorCommands(): StylebotEditorCommands {
      return this.$store.state.editorCommands;
    },

    dockOptions(): Array<{ value: string; label: string; title: string }> {
      return [
        {
          value: 'left',
          label: this.t('dock_to_left'),
          title: `${this.t('dock_to_left')} (${this.editorCommands.dockLeft})`,
        },
        {
          value: 'right',
          label: this.t('dock_to_right'),
          title: `${this.t('dock_to_right')} (r)`,
        },
      ];
    },

    adjustPageLayout(): boolean {
      return this.layout.adjustPageLayout;
    },
  },

  methods: {
    dock(dockLocation: string): void {
      this.$store.dispatch('setLayout', {
        ...this.layout,
        dockLocation,
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
  width: 230px;
  --menu-padding: 10px;
  --menu-item-padding-y: 7px;
  --menu-item-font-size: 12.5px;
  padding: 8px var(--menu-padding) !important;
  gap: 0 !important;
}

.dock-toggle {
  margin: 0 8px;
}

.push-page-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin: 16px 8px 6px;

  ::v-deep .switch {
    width: auto;
    gap: 0;
    margin-top: 2px;
  }
}

.push-page-copy {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.more-menu-divider {
  margin: 10px -10px;
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
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--muted-foreground);
}
</style>
