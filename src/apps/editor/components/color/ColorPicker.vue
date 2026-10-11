<template>
  <div class="color-picker">
    <div class="color-field" :class="{ open, disabled }">
      <button
        type="button"
        class="color-swatch"
        :class="{ empty: !shownColor }"
        :style="shownColor ? { background: shownColor } : undefined"
        :disabled="disabled"
        @click="toggle"
      />

      <input
        class="color-hex"
        :value="shownValue"
        :disabled="disabled"
        :placeholder="placeholder || '—'"
        :style="{ width: hexWidth }"
        spellcheck="false"
        @focus="onFocus"
        @input="onInput"
        @blur="onBlur"
        @keydown.enter="applyDraft.flush()"
      />
    </div>

    <div
      v-if="open"
      ref="popover"
      class="color-popover stylebot-color-picker"
      :style="{
        top: popoverTop + 'px',
        left: popoverLeft + 'px',
        visibility: positioned ? 'visible' : 'hidden',
      }"
    >
      <color-picker-popover
        :value="value"
        :role-label="roleLabel"
        @input="onPick"
        @preview="preview"
      />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { getDeclarationValue } from '@stylebot/css';
import type { Debounced } from '@stylebot/utils';
import { debounce } from '@stylebot/utils';

import ColorPickerPopover from './ColorPickerPopover.vue';
import { extractColor } from '../../utils/css-value';
import { computedColorPlaceholder } from '../../utils/computed-placeholder';

const ROLE_LABEL_KEYS: Record<string, string> = {
  color: 'color_picker_subtitle_text',
  'background-color': 'color_picker_subtitle_background',
  'border-color': 'color_picker_subtitle_border',
};

const MIN_HEX_CHARS = 7;
const MAX_HEX_CHARS = 20;

// Only one popover is open at a time; opening another closes this one first.
let closeOpenPicker: (() => void) | null = null;

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
    draft: string | null;
    applyDraft: Debounced<[string]>;
    open: boolean;
    popoverTop: number;
    popoverLeft: number;
    positioned: boolean;
    popoverResizeObserver: ResizeObserver | null;
  } {
    return {
      // What's typed, kept until blur: a half-typed value like `rgba(0` doesn't
      // parse, so the store would hand back the old color mid-typing.
      draft: null,
      applyDraft: debounce((value: string) => {
        this.value = value;
      }),
      open: false,
      popoverTop: 0,
      popoverLeft: 0,
      positioned: false,
      popoverResizeObserver: null,
    };
  },

  computed: {
    otherRule(): { selector: string; value: string } | null {
      return this.$store.getters.setByOtherSelector[this.property] ?? null;
    },

    placeholder(): string {
      return (
        this.otherRule?.value ??
        computedColorPlaceholder(
          this.$store.state.computedStyles,
          this.property
        )
      );
    },

    shownValue(): string {
      return this.draft ?? this.value;
    },

    shownColor(): string {
      return this.shownValue || this.placeholder;
    },

    // Only grows while typing, so replacing a value doesn't jolt the field.
    hexWidth(): string {
      const longest = Math.max(
        this.value.length,
        this.placeholder.length,
        this.draft?.length ?? 0
      );

      const chars = Math.min(Math.max(longest, MIN_HEX_CHARS), MAX_HEX_CHARS);

      return `calc(${chars}ch + 8px)`;
    },

    value: {
      get(): string {
        let value = getDeclarationValue(
          this.$store.getters.activeRule,
          this.property
        );
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

  watch: {
    // Typing still pending belongs to the rule it was typed for, not the next one.
    '$store.state.activeSelector'(): void {
      this.applyDraft.cancel();
      this.draft = null;
    },
  },

  beforeDestroy() {
    this.applyDraft.flush();
    if (closeOpenPicker === this.onClose) {
      closeOpenPicker = null;
    }
    this.popoverResizeObserver?.disconnect();
    window.removeEventListener('keydown', this.onWindowKeydown, true);
    document.removeEventListener('click', this.onDocumentClick);
  },

  methods: {
    onFocus(event: FocusEvent): void {
      (event.target as HTMLInputElement).select();
    },

    preview(value: string): void {
      this.$store.dispatch('previewDeclaration', {
        property: this.property,
        value,
      });
    },

    onInput(event: Event): void {
      this.draft = (event.target as HTMLInputElement).value;
      this.applyDraft(this.draft);
    },

    onBlur(): void {
      this.applyDraft.flush();
      this.draft = null;
    },

    onPick(value: string): void {
      this.applyDraft.cancel();
      this.draft = null;
      this.value = value;
    },

    toggle(): void {
      if (this.open) {
        this.onClose();
      } else {
        this.onOpen();
      }
    },

    onOpen(): void {
      closeOpenPicker?.();
      closeOpenPicker = this.onClose;

      this.open = true;
      this.positioned = false;
      this.$store.commit('setColorPickerVisible', true);

      this.$nextTick(() => {
        this.positionPopover();

        // The custom picker folds in and out, so re-clamp on any resize, not just at open.
        const popover = this.$refs.popover as HTMLElement | undefined;
        if (popover) {
          this.popoverResizeObserver = new ResizeObserver(() =>
            this.positionPopover()
          );
          this.popoverResizeObserver.observe(popover);
        }
      });

      // window capture, like SAnchoredMenu: fires before the editor's
      // document-level keydown handler, which would otherwise treat Escape as "close editor".
      window.addEventListener('keydown', this.onWindowKeydown, true);

      setTimeout(() => {
        document.addEventListener('click', this.onDocumentClick);
      }, 0);
    },

    onClose(): void {
      if (closeOpenPicker === this.onClose) {
        closeOpenPicker = null;
      }

      this.open = false;
      this.$store.commit('setColorPickerVisible', false);
      this.popoverResizeObserver?.disconnect();
      this.popoverResizeObserver = null;
      window.removeEventListener('keydown', this.onWindowKeydown, true);

      setTimeout(() => {
        document.removeEventListener('click', this.onDocumentClick);
      }, 0);
    },

    onWindowKeydown(event: KeyboardEvent): void {
      if (event.key !== 'Escape') {
        return;
      }

      // A dropdown inside the popover (e.g. the palette menu) is open —
      // its own Escape handler closes it; leave the picker alone.
      const popover = this.$refs.popover as HTMLElement | undefined;
      if (popover?.querySelector('.anchored-menu-panel')) {
        return;
      }

      event.stopPropagation();
      this.onClose();
    },

    // A page transform or filter on an ancestor breaks position: fixed —
    // render our best guess, then measure and correct the drift.
    positionPopover(): void {
      const popover = this.$refs.popover as HTMLElement | undefined;
      const field = this.$el.querySelector(
        '.color-field'
      ) as HTMLElement | null;
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
      // (mirrors SAnchoredMenu), clamped either way to stay on-screen.
      const spaceBelow = window.innerHeight - fieldRect.bottom;
      const spaceAbove = fieldRect.top;
      const flipUp =
        popover.offsetHeight + 6 + margin > spaceBelow &&
        spaceAbove > spaceBelow;

      const desiredTop = flipUp
        ? Math.max(fieldRect.top - popover.offsetHeight - 6, margin)
        : Math.min(
            fieldRect.bottom + 6,
            window.innerHeight - popover.offsetHeight - margin
          );

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
      if (this.open && !e.composedPath().includes(this.$el)) {
        this.onClose();
      }
    },
  },
});
</script>

<style lang="scss" scoped>
@import './color-picker-mixins';

.color-picker {
  position: relative;
  pointer-events: all;
}

.color-field {
  @include field-fill;

  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 96px;
  height: 28px;
  padding: 0 0 0 8px;

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
  width: 14px;
  height: 14px;
  border-radius: 4px;
  outline: none;
  cursor: pointer;
  // A literal black ring reads fine on a light panel but vanishes on a dark
  // one — mix against --text-primary so it stays visible in both themes.
  box-shadow: inset 0 0 0 1px
    color-mix(in srgb, var(--text-primary) 12%, transparent);

  &.empty {
    @include empty-swatch;
  }

  @include focus-ring;

  &:disabled {
    cursor: default;
  }
}

.color-hex {
  @include button-reset;

  flex: none;
  padding: 1px 8px 0 0;
  // Digits have no descenders, so a mathematically-centered box still reads
  // high — nudge down 1px to optically center it instead.
  line-height: 24px;
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--field-ink);
  outline: none;
  cursor: text;

  &::placeholder {
    color: var(--field-placeholder);
  }
}

.color-popover {
  position: fixed;
  z-index: 20;
}
</style>
