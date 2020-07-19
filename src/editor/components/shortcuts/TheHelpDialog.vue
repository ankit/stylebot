<template>
  <div class="stylebot-help-dialog">
    <div class="help-dialog-content p-4">
      <b-row>
        <b-col cols="11">
          <h1 class="title mb-4">Stylebot Keyboard shortcuts</h1>
        </b-col>

        <b-col cols="1">
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
                <b-th colspan="2">Global</b-th>
              </b-tr>
            </b-thead>

            <b-tbody>
              <b-tr>
                <b-td>Toggle stylebot editor</b-td>
                <b-td>⌥/Alt + m</b-td>
              </b-tr>

              <b-tr>
                <b-td>Toggle styling</b-td>
                <b-td>⌥/Alt + t</b-td>
              </b-tr>

              <b-tr>
                <b-td>Toggle readability</b-td>
                <b-td>⌥/Alt + r</b-td>
              </b-tr>
            </b-tbody>
          </b-table-simple>
        </b-col>

        <b-col cols="6">
          <b-table-simple>
            <b-thead>
              <b-tr>
                <b-th colspan="2">Editor</b-th>
              </b-tr>
            </b-thead>

            <b-tbody>
              <b-tr>
                <b-td>Toggle element inspection</b-td>
                <b-td>i</b-td>
              </b-tr>

              <b-tr>
                <b-td>Move stylebot to left / right</b-td>
                <b-td>p</b-td>
              </b-tr>

              <b-tr>
                <b-td>Switch to basic editor</b-td>
                <b-td>b</b-td>
              </b-tr>

              <b-tr>
                <b-td>Switch to magic editor</b-td>
                <b-td>m</b-td>
              </b-tr>

              <b-tr>
                <b-td>Switch to code editor</b-td>
                <b-td>c</b-td>
              </b-tr>

              <b-tr>
                <b-td>Show help</b-td>
                <b-td>?</b-td>
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
                <b-th colspan="2">Styling</b-th>
              </b-tr>
            </b-thead>

            <b-tbody>
              <b-tr>
                <b-td>Apply CSS to show/hide selected element(s)</b-td>
                <b-td>h</b-td>
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

export default Vue.extend({
  name: 'TheHelpDialog',

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
</style>
