<template>
  <div class="keyboard-shortcuts-view">
    <div class="view-header">
      <s-tooltip :text="t('back')">
        <icon-button
          :size="26"
          class="back-button"
          :aria-label="t('back')"
          @click="back"
        >
          <chevron-left-icon :size="15" />
        </icon-button>
      </s-tooltip>

      <heading as="h1" size="sm" class="title">
        {{ t('keyboard_shortcuts') }}
      </heading>

      <shortcut-chip small :value="editorCommands.close" :mac="mac" />
    </div>

    <div class="view-body">
      <div class="group">
        <s-text size="caption" variant="muted" class="group-label">
          {{ t('this_panel') }}
        </s-text>

        <div class="rows">
          <div v-for="row in panelRows" :key="row.label" class="row">
            <s-text class="row-label">{{ row.label }}</s-text>
            <div class="keys">
              <template v-for="(key, index) in row.keys">
                <shortcut-chip
                  v-if="key"
                  :key="index"
                  small
                  class="key-chip"
                  :value="key"
                  :mac="mac"
                />
                <s-text
                  v-else
                  :key="index"
                  size="caption"
                  variant="muted"
                  class="unassigned"
                >
                  {{ t('not_set') }}
                </s-text>
              </template>
            </div>
          </div>
        </div>
      </div>

      <div class="group">
        <s-text size="caption" variant="muted" class="group-label">
          {{ t('anywhere') }}
        </s-text>

        <div class="rows">
          <div v-for="row in globalRows" :key="row.label" class="row">
            <s-text class="row-label">{{ row.label }}</s-text>
            <div class="keys">
              <template v-for="(key, index) in row.keys">
                <shortcut-chip
                  v-if="key"
                  :key="index"
                  small
                  class="key-chip"
                  :value="key"
                  :mac="mac"
                />
                <s-text
                  v-else
                  :key="index"
                  size="caption"
                  variant="muted"
                  class="unassigned"
                >
                  {{ t('not_set') }}
                </s-text>
              </template>
            </div>
          </div>
        </div>
      </div>

      <div class="footer">
        <s-text size="caption" variant="muted">
          {{ t('change_in_options') }}
          <a href="#" class="options-link" @click="openOptions">
            {{ t('view_options') }}
          </a>
        </s-text>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import {
  Heading,
  IconButton,
  ShortcutChip,
  SText,
  STooltip,
} from '@stylebot/components';
import { ChevronLeftIcon } from '@stylebot/icons';
import type { StylebotCommands, StylebotEditorCommands } from '@stylebot/types';

import { openOptionsPage } from '../../utils/chrome';

type ShortcutRow = { label: string; keys: Array<string> };

export default Vue.extend({
  name: 'TheKeyboardShortcutsView',

  components: {
    Heading,
    IconButton,
    ShortcutChip,
    SText,
    STooltip,
    ChevronLeftIcon,
  },

  props: {
    // Forces macOS vs non-Mac rendering for every shortcut in the view;
    // left unset to auto-detect.
    mac: {
      type: Boolean,
      default: undefined,
    },
  },

  computed: {
    host(): string {
      return this.$store.state.host;
    },

    commands(): StylebotCommands {
      return this.$store.state.commands;
    },

    editorCommands(): StylebotEditorCommands {
      return this.$store.state.editorCommands;
    },

    panelRows(): Array<ShortcutRow> {
      const rows: Array<ShortcutRow> = [
        {
          label: this.t('toggle_inspector'),
          keys: [this.editorCommands.inspect],
        },
        {
          label: this.t('hide_selected_element'),
          keys: [this.editorCommands.hide],
        },
        {
          label: this.t('basic_code_presets'),
          keys: [
            this.editorCommands.basic,
            this.editorCommands.code,
            this.editorCommands.magic,
          ],
        },
        {
          label: this.t('dock_left_right'),
          keys: [this.editorCommands.dockLeft, this.editorCommands.dockRight],
        },
      ];

      rows.push({
        label: this.t('open_in_separate_window'),
        keys: [this.editorCommands.dockWindow],
      });

      return rows;
    },

    globalRows(): Array<ShortcutRow> {
      return [
        { label: this.t('toggle_editor'), keys: [this.commands.stylebot] },
        { label: this.t('toggle_styling'), keys: [this.commands.style] },
        {
          label: this.t('toggle_readability'),
          keys: [this.commands.readability],
        },
      ];
    },
  },

  mounted() {
    this.$store.commit('setInspecting', false);
  },

  methods: {
    back(): void {
      this.$store.commit('setHelp', false);
    },

    openOptions(event: MouseEvent): void {
      event.preventDefault();
      openOptionsPage('/basics');
    },
  },
});
</script>

<style lang="scss" scoped>
.keyboard-shortcuts-view {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  background: var(--tab-surface);
}

.view-header {
  flex: none;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  background: var(--panel-surface);
  border-bottom: 1px solid var(--panel-border);
}

.back-button ::v-deep .icon-button {
  border-radius: 7px;
}

.title {
  flex: 1;
  min-width: 0;
}

.view-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
  padding: 12px 16px 16px;
}

.group + .group {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--panel-border);
}

.group-label {
  display: block;
  padding-bottom: 5px;
  font-weight: 600;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: var(--text-faint);
}

.row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid var(--panel-border);

  &:last-child {
    border-bottom: none;
  }
}

.row-label {
  flex: 1;
  min-width: 0;
  color: var(--text-primary);
}

.keys {
  display: flex;
  align-items: center;
  gap: 3px;
}

.key-chip {
  min-width: 22px;
  justify-content: center;
}

.footer {
  margin-top: auto;
  padding-top: 12px;
}

.options-link {
  color: var(--accent-text);

  &:hover {
    text-decoration: underline;
  }
}
</style>
