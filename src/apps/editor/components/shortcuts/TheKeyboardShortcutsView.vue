<template>
  <div class="keyboard-shortcuts-view">
    <div class="view-header">
      <s-icon-button :size="26" :tooltip="t('back')" @click="back">
        <chevron-left-icon :size="15" />
      </s-icon-button>

      <s-heading as="h1" size="sm" class="title">
        {{ t('keyboard_shortcuts') }}
      </s-heading>

      <s-text size="caption" variant="muted">{{ t('esc_to_close') }}</s-text>
    </div>

    <div class="view-body">
      <section v-for="group in groups" :key="group.label" class="group">
        <div class="group-heading">
          <h2 class="group-label">{{ group.label }}</h2>
          <a
            v-if="group.editable"
            href="#"
            class="options-link"
            @click="openOptions"
          >
            {{ t('edit_in_options') }}
          </a>
        </div>

        <div class="rows" :class="`columns-${group.columns || 1}`">
          <div v-for="row in group.rows" :key="row.label" class="row">
            <span class="row-label">{{ row.label }}</span>
            <s-shortcut-chip
              v-if="row.key"
              small
              class="key-chip"
              :value="row.key"
              :mac="mac"
            />
            <s-text v-else size="caption" variant="muted">
              {{ t('not_set') }}
            </s-text>
          </div>
        </div>
      </section>

      <s-text size="caption" variant="muted" class="footer">
        {{ t('panel_keys_work_outside_text_fields') }}
      </s-text>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import {
  SHeading,
  SIconButton,
  SShortcutChip,
  SText,
} from '@stylebot/components';
import { ChevronLeftIcon } from '@stylebot/icons';
import type { StylebotCommands, StylebotEditorCommands } from '@stylebot/types';
import { isMac, openOptionsPage } from '@stylebot/utils';

import { undoShortcuts } from '../../store/undo-stack';
import { hasSidePanel } from '../../utils/side-panel';

type ShortcutRow = { label: string; key: string };
type ShortcutGroup = {
  label: string;
  rows: Array<ShortcutRow>;
  columns?: number;
  editable?: boolean;
};

export default Vue.extend({
  name: 'TheKeyboardShortcutsView',

  components: {
    SHeading,
    SIconButton,
    SShortcutChip,
    SText,
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
    commands(): StylebotCommands {
      return this.$store.state.commands;
    },

    editorCommands(): StylebotEditorCommands {
      return this.$store.state.editorCommands;
    },

    groups(): Array<ShortcutGroup> {
      const keys = this.editorCommands;
      const undo = undoShortcuts(this.mac ?? isMac());

      return [
        {
          label: this.t('this_panel'),
          rows: [
            { label: this.t('element_picker'), key: keys.inspect },
            { label: this.t('hide_selected'), key: keys.hide },
            { label: this.t('undo'), key: undo.undo },
            { label: this.t('redo'), key: undo.redo },
          ],
        },
        {
          label: this.t('tabs'),
          columns: 2,
          rows: [
            { label: this.t('basic_mode'), key: keys.basic },
            { label: this.t('code_mode'), key: keys.code },
            { label: this.t('presets_mode'), key: keys.magic },
            { label: this.t('chat_mode'), key: keys.chat },
          ],
        },
        hasSidePanel()
          ? {
              label: this.t('position'),
              columns: 2,
              rows: [
                { label: this.t('side_panel'), key: keys.dockSidePanel },
                { label: this.t('window'), key: keys.dockWindow },
                { label: this.t('left'), key: keys.dockLeft },
                { label: this.t('right'), key: keys.dockRight },
              ],
            }
          : {
              label: this.t('position'),
              columns: 3,
              rows: [
                { label: this.t('left'), key: keys.dockLeft },
                { label: this.t('right'), key: keys.dockRight },
                { label: this.t('window'), key: keys.dockWindow },
              ],
            },
        {
          label: this.t('anywhere'),
          editable: true,
          rows: [
            { label: this.t('toggle_editor'), key: this.commands.stylebot },
            { label: this.t('toggle_styling'), key: this.commands.style },
            {
              label: this.t('toggle_readability'),
              key: this.commands.readability,
            },
          ],
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
  padding: 12px 14px 12px 7px;
  background: var(--panel-surface);
  border-bottom: 1px solid var(--panel-border);
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
  gap: 8px;
  padding: 12px;
}

.group {
  flex: none;
  padding: 0 14px 8px;
  border-radius: 12px;
  background: var(--card-surface);
}

.group-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 12px 0 4px;
}

.group-label {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  line-height: 20px;
  color: var(--section-heading);
}

.options-link {
  font-size: 12px;
  color: var(--accent-text);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}

.rows {
  display: grid;
  column-gap: 20px;

  &.columns-2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  &.columns-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    column-gap: 16px;
  }
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 28px;
  padding: 2px 0;
}

.row-label {
  @include truncate;

  min-width: 0;
  font-size: 13px;
  color: var(--text-body);
}

.key-chip {
  min-width: 22px;
  justify-content: center;
}

.footer {
  padding: 4px 4px 0;
}
</style>
