<template>
  <b-row no-gutters class="stylebot-color-picker">
    <b-col cols="12">
      <div v-if="open" class="stylebot-color-picker-swatches">
        <v-swatches v-model="value" inline swatches="text-advanced" />
      </div>

      <button
        :disabled="disabled"
        class="stylebot-color-picker-trigger"
        :style="{ background: `${value}` }"
        @click="onOpen"
      />

      <b-form-input
        v-model="value"
        size="sm"
        class="stylebot-color-picker-input ml-2"
        :debounce="150"
        :disabled="disabled"
        @focus="onFocus"
      />
    </b-col>
  </b-row>
</template>

<script lang="ts">
import Vue from 'vue';
import VSwatches from 'vue-swatches';
import { Declaration } from 'postcss';

export default Vue.extend({
  name: 'ColorPicker',

  components: {
    VSwatches,
  },

  props: {
    property: {
      type: String,
      required: true,
    },
  },

  data: () => {
    return {
      open: false,
    };
  },

  computed: {
    value: {
      get(): string {
        const activeRule = this.$store.getters.activeRule;

        let value = '';
        if (activeRule) {
          activeRule.clone().walkDecls(this.property, (decl: Declaration) => {
            value = decl.value;
          });
        }

        return value;
      },

      set(value: string): void {
        this.$store.dispatch('applyDeclaration', {
          property: this.property,
          value,
        });
      },
    },

    disabled(): boolean {
      return !this.$store.state.activeSelector;
    },
  },

  methods: {
    onFocus(event: FocusEvent): void {
      (event.target as HTMLInputElement).select();
    },

    onOpen(): void {
      this.open = true;
      this.$store.commit('setColorPickerVisible', true);
      setTimeout(() => {
        document.addEventListener('click', this.onDocumentClick);
      }, 0);
    },

    onClose(): void {
      this.open = false;
      this.$store.commit('setColorPickerVisible', false);
      setTimeout(() => {
        document.removeEventListener('click', this.onDocumentClick);
      }, 0);
    },

    onDocumentClick(e: MouseEvent): void {
      const colorPickerSwatches = e.composedPath().find(el => {
        return (el as HTMLElement).className?.includes(
          'stylebot-color-picker-swatches'
        );
      });

      if (!colorPickerSwatches) {
        this.onClose();
      }
    },
  },
});
</script>

<style lang="scss">
.stylebot-app {
  .stylebot-color-picker {
    pointer-events: all;
  }

  .stylebot-color-picker-input {
    &.form-control {
      float: left;
      width: 100px;
    }
  }

  .stylebot-color-picker-trigger {
    width: 45px;
    height: 28px;
    padding: 4px;
    border: none;
    float: left;
    background: #eee;
  }

  .stylebot-color-picker-swatches {
    position: absolute;
    left: -90px;
    bottom: 36px;
    padding: 10px;
    padding-bottom: 0;
    background: #fff;
    border: 1px solid #ccc;
    z-index: 10000000000000;
  }
}
</style>
