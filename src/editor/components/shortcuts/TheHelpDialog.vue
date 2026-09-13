<template>
  <div class="stylebot-help-dialog-overlay">
    <div class="stylebot-help-dialog">
      <div class="header-row">
        <h1 class="title">Stylebot {{ t('keyboard_shortcuts') }}</h1>

        <button class="close-btn" @click="close">
          <x-icon :size="20" />
        </button>
      </div>

      <div class="tables-row">
        <table class="shortcuts-table">
          <thead>
            <tr>
              <th colspan="2">
                {{ t('global') }}
                <a href="#" class="customize" @click="customizeGlobalCommands">
                  {{ t('customize') }}
                </a>
              </th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td>{{ t('toggle_editor') }}</td>
              <td class="stylebot-key">{{ commands.stylebot }}</td>
            </tr>

            <tr>
              <td>{{ t('toggle_styling') }}</td>
              <td class="stylebot-key">{{ commands.style }}</td>
            </tr>

            <tr>
              <td>{{ t('toggle_readability') }}</td>
              <td class="stylebot-key">{{ commands.readability }}</td>
            </tr>

            <tr>
              <td>{{ t('toggle_grayscale') }}</td>
              <td class="stylebot-key">{{ commands.grayscale }}</td>
            </tr>
          </tbody>
        </table>

        <table class="shortcuts-table">
          <thead>
            <tr>
              <th colspan="2">{{ t('editor') }}</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td>{{ t('toggle_inspector') }}</td>
              <td class="stylebot-key">{{ editorCommands.inspect }}</td>
            </tr>

            <tr>
              <td>{{ t('set_basic_mode') }}</td>
              <td class="stylebot-key">{{ editorCommands.basic }}</td>
            </tr>

            <tr>
              <td>{{ t('set_magic_mode') }}</td>
              <td class="stylebot-key">{{ editorCommands.magic }}</td>
            </tr>

            <tr>
              <td>{{ t('set_code_mode') }}</td>
              <td class="stylebot-key">{{ editorCommands.code }}</td>
            </tr>

            <tr>
              <td>{{ t('resize') }}</td>
              <td class="stylebot-key">{{ editorCommands.resize }}</td>
            </tr>

            <tr>
              <td>{{ t('dock_to_left') }}</td>
              <td class="stylebot-key">{{ editorCommands.dockLeft }}</td>
            </tr>

            <tr>
              <td>{{ t('dock_to_right') }}</td>
              <td class="stylebot-key">{{ editorCommands.dockRight }}</td>
            </tr>

            <tr>
              <td>{{ t('adjust_page_layout') }}</td>
              <td class="stylebot-key">{{ editorCommands.pageLayout }}</td>
            </tr>

            <tr>
              <td>{{ t('hide_element') }}</td>
              <td class="stylebot-key">{{ editorCommands.hide }}</td>
            </tr>

            <tr>
              <td>{{ t('show_help') }}</td>
              <td class="stylebot-key">{{ editorCommands.help }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { XIcon } from '@stylebot/icons';
import { StylebotCommands, StylebotEditorCommands } from '@stylebot/types';

import { openOptionsPage } from '../../utils/chrome';

export default Vue.extend({
  name: 'TheHelpDialog',

  components: {
    XIcon,
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
    document.addEventListener('mousedown', this.mousedown);
  },

  beforeDestroy() {
    document.removeEventListener('mousedown', this.mousedown);
  },

  methods: {
    mousedown(event: MouseEvent): void {
      const el = event.composedPath()[0] as HTMLElement;

      if (!el.closest('.stylebot-help-dialog')) {
        this.close();
      }
    },

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
.stylebot-help-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000000000;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
}

.stylebot-help-dialog {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 65%;
  max-width: 900px;
  margin: 40px auto;
  max-height: calc(100% - 80px);
  overflow: auto;
  padding: 24px;
  border-radius: 14px;
  background: var(--background);
  color: var(--foreground);
}

.header-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 16px;
}

.title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
}

.close-btn {
  @include button-reset;
  display: inline-flex;
  padding: 4px;
  border-radius: 6px;
  color: var(--muted-foreground);
  cursor: pointer;

  &:hover {
    background: var(--accent);
    color: var(--foreground);
  }
}

.tables-row {
  display: flex;
  gap: 24px;
}

.shortcuts-table {
  flex: 1;
  min-width: 0;
  border-collapse: collapse;

  th {
    padding-bottom: 8px;
    text-align: left;
    font-size: 14px;
    font-weight: 600;
  }

  td {
    padding: 6px 0;
    border-top: 1px solid var(--border);
    font-size: 14px;
  }
}

.customize {
  float: right;
  font-weight: normal;
  color: var(--primary);
}

.stylebot-key {
  text-align: right;
  font-family: var(--font-mono);
  color: var(--muted-foreground);
}
</style>
