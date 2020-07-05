<template>
  <div>
    <button class="color-picker-btn" @click="toggle">
      <div class="color-picker-color" :style="{ background: `${color}` }" />
    </button>

    <chrome-picker
      v-if="enabled"
      :value="color"
      class="color-picker"
      @input="$emit('colorSelection', $event)"
    />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Chrome } from 'vue-color';

export default Vue.extend({
  name: 'ColorPicker',

  props: ['color'],

  components: {
    'chrome-picker': Chrome,
  },

  data(): {
    enabled: boolean;
  } {
    return {
      enabled: false,
    };
  },

  methods: {
    toggle(): void {
      if (!this.enabled) {
        this.enabled = true;
        document.addEventListener('click', this.handleDocumentClick);
      } else {
        this.enabled = false;
        document.removeEventListener('click', this.handleDocumentClick);
      }
    },

    handleDocumentClick(event: MouseEvent): void {
      const matchedElement = event.composedPath().find(el => {
        return (
          (el as HTMLElement).className?.includes('color-picker') ||
          (el as HTMLElement).className?.includes('color-picker=btn')
        );
      });

      if (!matchedElement) {
        this.toggle();
      }
    },
  },
});
</script>

<style lang="scss" scoped>
.color-picker-btn {
  width: 45px;
  height: 25px;
  padding: 3px;
  background: #eee;
  border: 1px solid #ccc;
}

.color-picker-color {
  height: 15px;
  border: 1px solid #888;
}

.color-picker {
  top: 28px;
  z-index: 1;
  right: -8px;
  position: absolute;
}
</style>
