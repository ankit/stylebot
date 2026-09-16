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

    <div
      v-if="open"
      ref="popover"
      class="color-popover stylebot-color-picker"
      :style="{ top: popoverTop + 'px', left: popoverLeft + 'px', visibility: positioned ? 'visible' : 'hidden' }"
    >
      <color-picker-popover :value="value" :role-label="roleLabel" @input="value = $event" />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Declaration } from 'postcss';

import ColorPickerPopover from './ColorPickerPopover.vue';
import { extractColor } from '../../utils/css-value';

const ROLE_LABEL_KEYS: Record<string, string> = {
  color: 'color_picker_subtitle_text',
  'background-color': 'color_picker_subtitle_background',
  'border-color': 'color_picker_subtitle_border',
};

export default Vue.extend({
  name: 'ColorPicker',

  components: {
    ColorPickerPopover,
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

  data(): {
    open: boolean;
    popoverTop: number;
    popoverLeft: number;
    positioned: boolean;
    popoverResizeObserver: ResizeObserver | null;
  } {
    return {
      open: false,
      popoverTop: 0,
      popoverLeft: 0,
      positioned: false,
      popoverResizeObserver: null,
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

    roleLabel(): string {
      return this.t(ROLE_LABEL_KEYS[this.property] || ROLE_LABEL_KEYS.color);
    },
  },

  beforeDestroy() {
    this.popoverResizeObserver?.disconnect();
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
      this.positioned = false;
      this.$store.commit('setColorPickerVisible', true);

      this.$nextTick(() => {
        this.positionPopover();

        // Content height varies by tab, so re-clamp on any resize, not just at open.
        const popover = this.$refs.popover as HTMLElement | undefined;
        if (popover) {
          this.popoverResizeObserver = new ResizeObserver(() => this.positionPopover());
          this.popoverResizeObserver.observe(popover);
        }
      });

      setTimeout(() => {
        document.addEventListener('click', this.onDocumentClick);
      }, 0);
    },

    onClose(): void {
      this.open = false;
      this.$store.commit('setColorPickerVisible', false);
      this.popoverResizeObserver?.disconnect();
      this.popoverResizeObserver = null;

      setTimeout(() => {
        document.removeEventListener('click', this.onDocumentClick);
      }, 0);
    },

    // vue-draggable-resizable's CSS transform on the dock breaks position:
    // fixed — render our best guess, then measure and correct the drift.
    positionPopover(): void {
      const popover = this.$refs.popover as HTMLElement | undefined;
      const field = this.$el.querySelector('.color-field') as HTMLElement | null;
      if (!popover || !field) {
        return;
      }

      const margin = 8;
      const fieldRect = field.getBoundingClientRect();

      const desiredLeft = Math.min(
        Math.max(fieldRect.right - popover.offsetWidth, margin),
        window.innerWidth - popover.offsetWidth - margin
      );

      // Flip above the trigger if it doesn't fit below but does fit above
      // (mirrors AnchoredMenu), clamped either way to stay on-screen.
      const spaceBelow = window.innerHeight - fieldRect.bottom;
      const spaceAbove = fieldRect.top;
      const flipUp = popover.offsetHeight + 6 + margin > spaceBelow && spaceAbove > spaceBelow;

      const desiredTop = flipUp
        ? Math.max(fieldRect.top - popover.offsetHeight - 6, margin)
        : Math.min(fieldRect.bottom + 6, window.innerHeight - popover.offsetHeight - margin);

      this.popoverLeft = desiredLeft;
      this.popoverTop = desiredTop;

      this.$nextTick(() => {
        const actualRect = popover.getBoundingClientRect();
        this.popoverLeft += desiredLeft - actualRect.left;
        this.popoverTop += desiredTop - actualRect.top;
        this.positioned = true;
      });
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
  height: 27px;
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
  // A literal black ring reads fine on a light panel but vanishes on a dark
  // one — mix against --text-primary so it stays visible in both themes.
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--text-primary) 12%, transparent);

  &.empty {
    background: repeating-linear-gradient(
      -45deg,
      transparent,
      transparent 4px,
      color-mix(in srgb, var(--text-primary) 20%, transparent) 4px,
      color-mix(in srgb, var(--text-primary) 20%, transparent) 5px
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
  padding: 1px 8px 0;
  // Digits have no descenders, so a mathematically-centered box still reads
  // high — nudge down 1px to optically center it instead.
  line-height: 24px;
  font-family: var(--font-mono);
  font-size: 12.5px;
  color: var(--text-primary);
  outline: none;
  cursor: text;

  &::placeholder {
    color: var(--text-muted);
  }
}

.color-popover {
  position: fixed;
  z-index: 20;
}
</style>
