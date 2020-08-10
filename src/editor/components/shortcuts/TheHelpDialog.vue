<template>
  <div class="stylebot-help-dialog">
    <div class="help-dialog-content p-4">
      <b-row>
        <b-col cols="11">
          <h1 class="title mb-4">Stylebot {{ t('keyboard_shortcuts') }}</h1>
        </b-col>

        <b-col cols="1" style="text-align: right;">
          <button class="close-btn" @click="close">
            <b-icon icon="x-circle" />
          </button>
        </b-col>
      </b-row>

      <b-row>
        <b-col cols="6">
          <b-table-simple>
            <b-thead>
              <b-tr>
                <b-th colspan="2">
                  {{ t('global') }}
                  <a
                    href="#"
                    class="customize"
                    @click="customizeGlobalCommands"
                  >
                    {{ t('customize') }}
                  </a>
                </b-th>
              </b-tr>
            </b-thead>

            <b-tbody>
              <b-tr>
                <b-td>{{ t('toggle_editor') }}</b-td>
                <b-td class="stylebot-key">
                  {{ commands['stylebot'] }}
                </b-td>
              </b-tr>

              <b-tr>
                <b-td>{{ t('toggle_styling') }}</b-td>
                <b-td class="stylebot-key">
                  {{ commands['style'] }}
                </b-td>
              </b-tr>

              <b-tr>
                <b-td>{{ t('toggle_readability') }}</b-td>
                <b-td class="stylebot-key">
                  {{ commands['readability'] }}
                </b-td>
              </b-tr>

              <b-tr>
                <b-td>{{ t('toggle_grayscale') }}</b-td>
                <b-td class="stylebot-key">
                  {{ commands['grayscale'] }}
                </b-td>
              </b-tr>
            </b-tbody>
          </b-table-simple>
        </b-col>

        <b-col cols="6">
          <b-table-simple>
            <b-thead>
              <b-tr>
                <b-th colspan="2">{{ t('editor') }}</b-th>
              </b-tr>
            </b-thead>

            <b-tbody>
              <b-tr>
                <b-td>{{ t('toggle_inspector') }}</b-td>
                <b-td class="stylebot-key">
                  {{ editorCommands['inspect'] }}
                </b-td>
              </b-tr>

              <b-tr>
                <b-td>{{ t('move_editor') }}</b-td>
                <b-td class="stylebot-key">
                  {{ editorCommands['position'] }}
                </b-td>
              </b-tr>

              <b-tr>
                <b-td>{{ t('set_basic_mode') }}</b-td>
                <b-td class="stylebot-key">{{ editorCommands['basic'] }}</b-td>
              </b-tr>

              <b-tr>
                <b-td>{{ t('set_magic_mode') }}</b-td>
                <b-td class="stylebot-key">{{ editorCommands['magic'] }}</b-td>
              </b-tr>

              <b-tr>
                <b-td>{{ t('set_code_mode') }}</b-td>
                <b-td class="stylebot-key">{{ editorCommands['code'] }}</b-td>
              </b-tr>

              <b-tr>
                <b-td>{{ t('show_help') }}</b-td>
                <b-td class="stylebot-key">{{ editorCommands['help'] }}</b-td>
              </b-tr>
            </b-tbody>
          </b-table-simple>
        </b-col>
      </b-row>

      <b-row>
        <b-col cols="6">
          <b-table-simple>
            <b-thead>
              <b-tr>
                <b-th colspan="2">{{ t('styling') }}</b-th>
              </b-tr>
            </b-thead>

            <b-tbody>
              <b-tr>
                <b-td>{{ t('hide_element') }}</b-td>
                <b-td class="stylebot-key">
                  {{ editorCommands['hide'] }}
                </b-td>
              </b-tr>
            </b-tbody>
          </b-table-simple>
        </b-col>
      </b-row>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { StylebotCommands, StylebotEditorCommands } from '@stylebot/types';

import { openOptionsPage } from '../../utils/chrome';

export default Vue.extend({
  name: 'TheHelpDialog',

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

      if (!el.closest('.help-dialog-content')) {
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
.stylebot-help-dialog {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000000000;
  display: block;
  width: 100%;
  height: 100%;
  overflow: hidden;
  outline: 0;
  font-size: 15px;
  background: #000000b3;
}

.help-dialog-content {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 65%;
  max-width: 900px;
  pointer-events: auto;
  background-color: #fff;
  outline: 0;
  margin: 200px auto;
}

.title {
  color: #000;
  font-size: 24px;
  font-weight: 250;
}

.close-btn {
  margin: 0;
  padding: 0;
  border: none;
  font-size: 24px;
  background: none;
  color: #666;
}

.customize {
  float: right;
  font-weight: normal;
}

.stylebot-key {
  text-align: right;
}
</style>
