<template>
  <s-dialog @cancel="close">
    <div class="stylebot-help-dialog" role="dialog" aria-modal="true" aria-labelledby="help-dialog-title">
      <div class="header-row">
        <heading id="help-dialog-title" as="h1" size="md">{{ t('keyboard_shortcuts') }}</heading>

        <s-tooltip :text="t('close')">
          <icon-button :size="26" @click="close">
            <icon-x :size="18" />
          </icon-button>
        </s-tooltip>
      </div>

      <div class="section">
        <div class="section-header">
          <s-text size="caption" variant="muted" class="section-label">{{ t('global') }}</s-text>
          <a href="#" class="customize" @click="customizeGlobalCommands">{{ t('customize') }}</a>
        </div>

        <div class="rows">
          <div class="row">
            <s-text class="row-label">{{ t('toggle_editor') }}</s-text>
            <shortcut-chip small class="row-chip" :value="commands.stylebot" />
          </div>

          <div class="row">
            <s-text class="row-label">{{ t('toggle_styling') }}</s-text>
            <shortcut-chip small class="row-chip" :value="commands.style" />
          </div>

          <div class="row">
            <s-text class="row-label">{{ t('toggle_readability') }}</s-text>
            <shortcut-chip small class="row-chip" :value="commands.readability" />
          </div>

          <div class="row">
            <s-text class="row-label">{{ t('toggle_grayscale') }}</s-text>
            <shortcut-chip small class="row-chip" :value="commands.grayscale" />
          </div>
        </div>
      </div>

      <div class="section">
        <div class="section-header">
          <s-text size="caption" variant="muted" class="section-label">{{ t('editor') }}</s-text>
        </div>

        <div class="rows">
          <div class="row">
            <s-text class="row-label">{{ t('toggle_inspector') }}</s-text>
            <shortcut-chip small class="row-chip" :value="editorCommands.inspect" />
          </div>

          <div class="row">
            <s-text class="row-label">{{ t('set_basic_mode') }}</s-text>
            <shortcut-chip small class="row-chip" :value="editorCommands.basic" />
          </div>

          <div class="row">
            <s-text class="row-label">{{ t('set_presets_mode') }}</s-text>
            <shortcut-chip small class="row-chip" :value="editorCommands.magic" />
          </div>

          <div class="row">
            <s-text class="row-label">{{ t('set_code_mode') }}</s-text>
            <shortcut-chip small class="row-chip" :value="editorCommands.code" />
          </div>

          <div class="row">
            <s-text class="row-label">{{ t('resize') }}</s-text>
            <shortcut-chip small class="row-chip" :value="editorCommands.resize" />
          </div>

          <div class="row">
            <s-text class="row-label">{{ t('dock_to_left') }}</s-text>
            <shortcut-chip small class="row-chip" :value="editorCommands.dockLeft" />
          </div>

          <div class="row">
            <s-text class="row-label">{{ t('dock_to_right') }}</s-text>
            <shortcut-chip small class="row-chip" :value="editorCommands.dockRight" />
          </div>

          <div class="row">
            <s-text class="row-label">{{ t('adjust_page_layout') }}</s-text>
            <shortcut-chip small class="row-chip" :value="editorCommands.pageLayout" />
          </div>

          <div class="row">
            <s-text class="row-label">{{ t('hide_element') }}</s-text>
            <shortcut-chip small class="row-chip" :value="editorCommands.hide" />
          </div>

          <div class="row">
            <s-text class="row-label">{{ t('show_help') }}</s-text>
            <shortcut-chip small class="row-chip" :value="editorCommands.help" />
          </div>
        </div>
      </div>
    </div>
  </s-dialog>
</template>

<script lang="ts">
import Vue from 'vue';
import { Heading, IconButton, ShortcutChip, SDialog, SText, STooltip } from '@stylebot/components';
import { IconX } from '@stylebot/icons';
import { StylebotCommands, StylebotEditorCommands } from '@stylebot/types';

import { openOptionsPage } from '../../utils/chrome';

export default Vue.extend({
  name: 'TheHelpDialog',

  components: {
    Heading,
    IconButton,
    ShortcutChip,
    SDialog,
    SText,
    STooltip,
    IconX,
  },

  computed: {
    commands(): StylebotCommands {
      return this.$store.state.commands;
    },

    editorCommands(): StylebotEditorCommands {
      return this.$store.state.editorCommands;
    },
  },

  mounted() {
    this.$store.commit('setInspecting', false);
  },

  methods: {
    customizeGlobalCommands(event: MouseEvent): void {
      event.preventDefault();
      openOptionsPage();
    },

    close(): void {
      this.$store.commit('setHelp', false);
    },
  },
});
</script>

<style lang="scss" scoped>
.stylebot-help-dialog {
  width: 400px;
  height: fit-content;
  padding: 18px 22px;
  border: 1px solid var(--menu-border);
  border-radius: 14px;
  background: var(--menu-surface);
  color: var(--text-primary);
  box-shadow: 0 24px 64px var(--menu-shadow);
}

.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 6px;
}

.section {
  margin-top: 16px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 6px;
}

.section-label {
  flex: 1;
  font-weight: 600;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: var(--text-faint);
}

.customize {
  flex: none;
  font-size: 11.5px;
  font-weight: 500;
  color: var(--accent);

  &:hover {
    text-decoration: underline;
  }
}

.row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 9px 0;
  border-bottom: 1px solid var(--panel-border);

  &:last-child {
    border-bottom: none;
  }
}

.row-label {
  flex: 1;
  min-width: 0;
  color: var(--text-secondary);
}

.row-chip {
  min-width: 24px;
  justify-content: center;
}
</style>
