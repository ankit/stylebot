<template>
  <div class="color-picker">
    <div class="color-field" :class="{ open, disabled }">
      <button
        type="button"
        class="color-swatch"
        :class="{ empty: !value }"
        :style="value ? { background: value } : undefined"
        :disabled="disabled"
        @click="toggle"
      />

      <input
        class="color-hex"
        :value="value"
        :disabled="disabled"
        placeholder="—"
        spellcheck="false"
        @focus="onFocus"
        @input="onInput"
      />
    </div>

    <div v-if="open" class="color-popover stylebot-color-picker">
      <basic-color-palette v-if="basicColorPalette" v-model="value">
        <color-palette-footer v-model="value" />
      </basic-color-palette>

      <material-color-palette v-else v-model="value">
        <color-palette-footer v-model="value" />
      </material-color-palette>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Declaration } from 'postcss';

import BasicColorPalette from './BasicColorPalette.vue';
import MaterialColorPalette from './MaterialColorPalette.vue';
import ColorPaletteFooter from './ColorPaletteFooter.vue';
import { extractColor } from '../../utils/css-value';

export default Vue.extend({
  name: 'ColorPicker',

  components: {
    BasicColorPalette,
    MaterialColorPalette,
    ColorPaletteFooter,
  },

  props: {
    property: {
      type: String,
      required: true,
    },

    // Raw value of a shorthand property (e.g. border: 1px solid red) to
    // pull a color from when `property` itself isn't declared.
    fallback: {
      type: String,
      default: '',
    },
  },

  data() {
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

        if (!value && this.fallback) {
          value = extractColor(this.fallback);
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

    basicColorPalette(): boolean {
      return this.$store.state.options.colorPalette === 'basic';
    },
  },

  methods: {
    onFocus(event: FocusEvent): void {
      (event.target as HTMLInputElement).select();
    },

    onInput(event: Event): void {
      this.value = (event.target as HTMLInputElement).value;
    },

    toggle(): void {
      if (this.open) {
        this.onClose();
      } else {
        this.onOpen();
      }
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
      const insidePicker = e.composedPath().find(el => {
        return (el as HTMLElement).className?.includes?.('color-picker');
      });

      if (!insidePicker) {
        this.onClose();
      }
    },
  },
});
</script>

<style lang="scss" scoped>
.color-picker {
  position: relative;
  pointer-events: all;
}

.color-field {
  box-sizing: border-box;
  display: flex;
  align-items: stretch;
  width: 108px;
  @include field-border;

  // Only the hex text field highlights the whole pill — the swatch button
  // (which opens the picker) gets its own focus ring instead.
  &:has(.color-hex:focus),
  &.open {
    @include field-active-border;
  }

  &.disabled {
    opacity: 0.6;
  }
}

.color-swatch {
  @include button-reset;
  flex: none;
  width: 26px;
  align-self: stretch;
  border-right: 1px solid var(--panel-border);
  border-radius: 6px 0 0 6px;
  outline: none;
  cursor: pointer;
  box-shadow: inset 0 0 0 1px rgb(0 0 0 / 10%);

  &.empty {
    background: repeating-linear-gradient(
      -45deg,
      transparent,
      transparent 4px,
      var(--panel-border) 4px,
      var(--panel-border) 5px
    );
  }

  @include focus-ring;

  &:disabled {
    cursor: default;
  }
}

.color-hex {
  @include button-reset;
  flex: 1;
  min-width: 0;
  padding: 5px 8px;
  font-family: var(--font-mono);
  font-size: 12.5px;
  line-height: 1.2;
  color: var(--text-primary);
  outline: none;
  cursor: text;

  &::placeholder {
    color: var(--text-muted);
  }
}

.color-popover {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  z-index: 20;
}
</style>
