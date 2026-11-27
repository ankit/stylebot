<template>
  <s-anchored-menu class="more-action-anchor" @open="onOpen">
    <template #trigger="{ toggle }">
      <s-icon-button :size="24" :tooltip="t('more_actions')" @click="toggle">
        <more-icon :size="16" />
      </s-icon-button>
    </template>

    <template #default="{ close }">
      <s-menu dense size="small" class="more-menu">
        <s-menu-item
          :disabled="!canUndo"
          @click="
            undo();
            close();
          "
        >
          <span class="menu-item-row">
            <span>{{ t('undo') }}</span>
            <s-shortcut-chip small :value="undoShortcuts.undo" />
          </span>
        </s-menu-item>

        <s-menu-item
          :disabled="!canRedo"
          @click="
            redo();
            close();
          "
        >
          <span class="menu-item-row">
            <span>{{ t('redo') }}</span>
            <s-shortcut-chip small :value="undoShortcuts.redo" />
          </span>
        </s-menu-item>

        <s-menu-divider class="more-menu-divider" />

        <div class="dock-row">
          <s-text>{{ t('position') }}</s-text>

          <s-segmented-control
            fit
            :value="layout.dockLocation"
            :options="dockOptions"
            @change="
              dock($event);
              close();
            "
          >
            <template #option="{ option }">
              <component :is="option.icon" :size="14" />
            </template>
          </s-segmented-control>
        </div>

        <div class="dock-row">
          <s-text>{{ t('theme') }}</s-text>

          <s-segmented-control
            fit
            :value="appearance"
            :options="appearanceOptions"
            @change="setAppearance"
          >
            <template #option="{ option }">
              <component :is="option.icon" :size="14" />
            </template>
          </s-segmented-control>
        </div>

        <s-menu-divider class="more-menu-divider" />

        <s-menu-item
          @click="
            keyboardShortcuts();
            close();
          "
        >
          <span class="menu-item-row">
            <span>{{ t('keyboard_shortcuts') }}</span>
            <s-shortcut-chip small :value="editorCommands.help" />
          </span>
        </s-menu-item>

        <s-menu-item
          @click="
            optionsPage();
            close();
          "
        >
          {{ t('view_options') }}
        </s-menu-item>

        <s-menu-item
          @click="
            feedbackPage();
            close();
          "
        >
          {{ t('send_feedback') }}
        </s-menu-item>
      </s-menu>
    </template>
  </s-anchored-menu>
</template>

<script lang="ts">
import Vue from 'vue';
import {
  SAnchoredMenu,
  SMenu,
  SMenuItem,
  SMenuDivider,
  SIconButton,
  SSegmentedControl,
  SShortcutChip,
  SText,
} from '@stylebot/components';
import {
  MoreIcon,
  DockLeftIcon,
  DockRightIcon,
  SidePanelIcon,
  UndockIcon,
  SunIcon,
  MoonIcon,
  MonitorIcon,
} from '@stylebot/icons';

import type {
  StylebotAppearance,
  StylebotEditorCommands,
  StylebotLayout,
  StylebotDockLocation,
} from '@stylebot/types';

import { isMac, openOptionsPage, openFeedbackPage } from '@stylebot/utils';

import { undoShortcuts } from '../../store/undo-stack';
import { hasSidePanel } from '../../utils/side-panel';
import { hasEditorWindow } from '../../utils/editor-window';

type DockOption = {
  value: StylebotDockLocation;
  icon: string;
  title: string;
  shortcut: string;
};

export default Vue.extend({
  name: 'TheMoreAction',

  components: {
    SAnchoredMenu,
    SMenu,
    SMenuItem,
    SMenuDivider,
    SIconButton,
    SSegmentedControl,
    SShortcutChip,
    SText,
    MoreIcon,
    DockLeftIcon,
    DockRightIcon,
    SidePanelIcon,
    UndockIcon,
    SunIcon,
    MoonIcon,
    MonitorIcon,
  },

  computed: {
    canUndo(): boolean {
      return this.$store.getters.canUndo;
    },

    canRedo(): boolean {
      return this.$store.getters.canRedo;
    },

    undoShortcuts(): { undo: string; redo: string } {
      return undoShortcuts(isMac());
    },

    layout(): StylebotLayout {
      return this.$store.state.options.layout;
    },

    editorCommands(): StylebotEditorCommands {
      return this.$store.state.editorCommands;
    },

    dockOptions(): Array<DockOption> {
      const separateWindow: Array<DockOption> = hasEditorWindow()
        ? [
            {
              value: 'window',
              icon: 'undock-icon',
              title: this.t('open_in_separate_window'),
              shortcut: this.editorCommands.dockWindow,
            },
          ]
        : [];

      const inPage: Array<DockOption> = [
        {
          value: 'left',
          icon: 'dock-left-icon',
          title: this.t('dock_left_in_page'),
          shortcut: this.editorCommands.dockLeft,
        },
        {
          value: 'right',
          icon: 'dock-right-icon',
          title: this.t('dock_right_in_page'),
          shortcut: this.editorCommands.dockRight,
        },
      ];

      if (!hasSidePanel()) {
        return [...inPage, ...separateWindow];
      }

      return [
        {
          value: 'sidepanel',
          icon: 'side-panel-icon',
          title: this.t('open_in_side_panel'),
          shortcut: this.editorCommands.dockSidePanel,
        },
        ...separateWindow,
        ...inPage,
      ];
    },

    appearance(): StylebotAppearance {
      return this.$store.state.options.appearance;
    },

    appearanceOptions(): Array<{
      value: StylebotAppearance;
      icon: string;
      title: string;
    }> {
      return [
        {
          value: 'system',
          icon: 'monitor-icon',
          title: this.t('appearance_system'),
        },
        {
          value: 'light',
          icon: 'sun-icon',
          title: this.t('appearance_light'),
        },
        {
          value: 'dark',
          icon: 'moon-icon',
          title: this.t('appearance_dark'),
        },
      ];
    },
  },

  methods: {
    undo(): void {
      this.$store.dispatch('undo');
    },

    redo(): void {
      this.$store.dispatch('redo');
    },

    onOpen(): void {
      this.$store.commit('setInspecting', false);
    },

    dock(dockLocation: StylebotDockLocation): void {
      this.$store.dispatch('setDockLocation', dockLocation);
    },

    setAppearance(appearance: StylebotAppearance): void {
      this.$store.dispatch('setAppearance', appearance);
    },

    keyboardShortcuts(): void {
      this.$store.commit('setHelp', true);
    },

    optionsPage(): void {
      openOptionsPage();
    },

    feedbackPage(): void {
      openFeedbackPage();
    },
  },
});
</script>

<style lang="scss" scoped>
.more-menu {
  --field-surface: var(--card-field-surface);

  width: max-content;
  min-width: 200px;
}

.more-menu .text,
.more-menu .menu-item:not(:disabled) {
  color: var(--text-body);
}

.dock-row {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  min-height: 32px;
  padding: 0 8px;
}

.more-menu .more-menu-divider {
  margin: 4px 8px;
}

.more-menu .menu-item:disabled .chip {
  opacity: 0.5;
}

.menu-item-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
}

.more-menu .menu-item {
  margin: 0;
  min-height: 32px;
  padding: 0 8px;
  border-radius: 8px;
}
</style>
