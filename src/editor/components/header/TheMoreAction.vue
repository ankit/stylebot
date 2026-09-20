<template>
  <anchored-menu class="more-action-anchor">
    <template #trigger="{ toggle }">
      <s-tooltip :text="t('view_options')">
        <icon-button :size="20" :aria-label="t('view_options')" @click="toggle">
          <more-icon :size="20" />
        </icon-button>
      </s-tooltip>
    </template>

    <template #default="{ close }">
      <s-menu dense class="more-menu">
        <div class="dock-row">
          <s-text>{{ t('dock_side') }}</s-text>

          <s-segmented-control
            fit
            class="dock-toggle"
            :value="layout.dockLocation"
            :options="dockOptions"
            @change="
              dock($event);
              close();
            "
          >
            <template #option="{ option }">
              <component :is="option.icon" :size="16" />
            </template>
          </s-segmented-control>
        </div>

        <div v-if="host === 'page'" class="push-page-row">
          <div class="push-page-copy">
            <s-text>{{ t('adjust_page_layout') }}</s-text>
            <s-text size="caption" variant="muted">
              {{ t('adjust_page_layout_description') }}
            </s-text>
          </div>

          <toggle-switch
            :value="adjustPageLayout"
            size="lg"
            @change="toggleAdjustPageLayout"
          />
        </div>

        <hr class="more-menu-divider" />

        <menu-item
          @click="
            keyboardShortcuts();
            close();
          "
        >
          <span class="menu-item-row">
            <span>{{ t('keyboard_shortcuts') }}</span>
            <span class="menu-item-hint">{{ editorCommands.help }}</span>
          </span>
        </menu-item>

        <menu-item
          @click="
            optionsPage();
            close();
          "
        >
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
  STooltip,
  ToggleSwitch,
  SSegmentedControl,
  SText,
} from '@stylebot/components';
import {
  MoreIcon,
  ExternalLinkIcon,
  DockLeftIcon,
  DockRightIcon,
  UndockIcon,
} from '@stylebot/icons';

import { StylebotEditorCommands, StylebotLayout } from '@stylebot/types';

import { openOptionsPage } from '../../utils/chrome';

export default Vue.extend({
  name: 'TheMoreAction',

  components: {
    AnchoredMenu,
    SMenu,
    MenuItem,
    IconButton,
    STooltip,
    ToggleSwitch,
    SSegmentedControl,
    SText,
    MoreIcon,
    ExternalLinkIcon,
    DockLeftIcon,
    DockRightIcon,
    UndockIcon,
  },

  computed: {
    host(): string {
      return this.$store.state.host;
    },

    layout(): StylebotLayout {
      return this.$store.state.options.layout;
    },

    editorCommands(): StylebotEditorCommands {
      return this.$store.state.editorCommands;
    },

    dockOptions(): Array<{
      value: StylebotLayout['dockLocation'];
      icon: string;
      title: string;
      shortcut: string;
    }> {
      return [
        {
          value: 'window',
          icon: 'undock-icon',
          title: this.t('open_in_separate_window'),
          shortcut: this.editorCommands.dockWindow,
        },
        {
          value: 'left',
          icon: 'dock-left-icon',
          title: this.t('dock_to_left'),
          shortcut: this.editorCommands.dockLeft,
        },
        {
          value: 'right',
          icon: 'dock-right-icon',
          title: this.t('dock_to_right'),
          shortcut: this.editorCommands.dockRight,
        },
      ];
    },

    adjustPageLayout(): boolean {
      return this.layout.adjustPageLayout;
    },
  },

  methods: {
    dock(dockLocation: StylebotLayout['dockLocation']): void {
      this.$store.dispatch('setDockLocation', dockLocation);
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
  padding: 8px var(--menu-padding) !important;
  gap: 0 !important;
}

.dock-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 4px 8px;
}

.dock-toggle ::v-deep .segment {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 8px;

  &.active svg {
    stroke-width: 1.5;
  }
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
  border-top: 1px solid var(--panel-border);
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
  color: var(--text-muted);
}
</style>
