<template>
  <anchored-menu
    ref="menu"
    class="autocomplete"
    retain-focus
    :trigger-field="() => $refs.input"
    @cancel="onCancel"
    @leave="$emit('leave', value)"
  >
    <template #trigger="{ open }">
      <div class="autocomplete-pill" :class="{ disabled }">
        <div
          v-if="chips && !focused && !open && chipParts.length"
          ref="chips"
          class="autocomplete-chips"
          :class="{ quiet: quietFocus }"
          role="combobox"
          aria-expanded="false"
          tabindex="0"
          @mousedown.prevent="revealInput"
          @keydown="onChipsKeydown"
          @blur="quietFocus = false"
        >
          <s-chip v-for="(part, i) in chipParts" :key="i">{{ part }}</s-chip>
        </div>

        <textarea
          v-else
          ref="input"
          rows="1"
          class="autocomplete-input"
          :class="{ mono }"
          :disabled="disabled"
          :value="value"
          :placeholder="placeholder"
          spellcheck="false"
          @keydown.enter.prevent="onEnter"
          @keydown.down="onArrowKey(open, $event)"
          @keydown.up="onArrowKey(open, $event)"
          @focus="onFocus"
          @blur="onBlur"
          @mousedown="onMouseDown"
          @mouseup="onMouseUp"
          @input="onInput($event.target.value)"
        />

        <slot name="suffix" />

        <button
          type="button"
          class="autocomplete-chevron"
          :class="{ open }"
          :disabled="disabled"
          tabindex="-1"
          @mousedown.prevent
          @click="open ? hideMenu() : showAll(true)"
        >
          <chevron-down-icon />
        </button>
      </div>
    </template>

    <s-menu
      dense
      :min-width="minWidth"
      class="autocomplete-menu"
      @pointerdown.native="pointerPick = true"
      @keydown.native="pointerPick = false"
    >
      <slot name="header" />

      <div
        v-for="(item, index) in items"
        :key="itemKey ? item[itemKey] : index"
        class="autocomplete-option"
      >
        <slot name="item" :item="item" :select="() => onSelect(item)" />
      </div>
    </s-menu>
  </anchored-menu>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';

import { ChevronDownIcon } from '@stylebot/icons';

import AnchoredMenu from './AnchoredMenu.vue';
import SMenu from './SMenu.vue';
import SChip from './SChip.vue';

type AnchoredMenuRef = {
  open: boolean;
  show(): void;
  close(options?: { skipRestoreFocus?: boolean }): void;
};

export default Vue.extend({
  name: 'SAutocomplete',

  components: {
    AnchoredMenu,
    SMenu,
    SChip,
    ChevronDownIcon,
  },

  model: {
    prop: 'value',
    event: 'input',
  },

  props: {
    // Current text value.
    value: {
      type: String,
      default: '',
    },

    // Suggestions to show — already filtered by the consumer. The menu opens
    // only when this is non-empty (and the field is being edited).
    items: {
      type: Array as PropType<Array<Record<string, unknown>>>,
      default: () => [],
    },

    // Field on each item to use as the v-for key; falls back to the index.
    itemKey: {
      type: String,
      default: 'id',
    },

    disabled: {
      type: Boolean,
      default: false,
    },

    placeholder: {
      type: String,
      default: '',
    },

    minWidth: {
      type: Number,
      default: 176,
    },

    // Render the input in a monospace font (e.g. for CSS selectors / values).
    mono: {
      type: Boolean,
      default: false,
    },

    // Render a comma-separated value as pills when not being edited (e.g.
    // for a multi-part CSS selector), instead of the raw wrapped text.
    chips: {
      type: Boolean,
      default: false,
    },

    // Formats each pill's text (e.g. to drop the quotes around a font name).
    chipLabel: {
      type: Function as PropType<(part: string) => string>,
      default: (part: string) => part,
    },

    // Select the whole value on focus, so typing replaces it (e.g. picking a
    // different font) while the caret can still be placed with a second click.
    selectOnFocus: {
      type: Boolean,
      default: false,
    },

    // Leave the field after a pick or Enter instead of keeping the caret in
    // it, so the committed value shows (e.g. as chips) right away.
    blurOnCommit: {
      type: Boolean,
      default: false,
    },
  },

  data(): {
    suppressReopen: boolean;
    focused: boolean;
    keepSelectionOnMouseUp: boolean;
    revealSelect: boolean;
    pointerPick: boolean;
    quietFocus: boolean;
    typedAhead: string | null;
  } {
    return {
      suppressReopen: false,
      focused: false,
      revealSelect: true,
      // A pick made with the pointer hands focus back to the chips without
      // a focus ring, as it would have on any other click.
      pointerPick: false,
      quietFocus: false,
      // Keys typed on the chips before the field they reveal has mounted.
      typedAhead: null,
      // The mouseup that ends a focusing click would collapse the
      // select-on-focus selection to a caret; swallow that one mouseup.
      keepSelectionOnMouseUp: false,
    };
  },

  computed: {
    chipParts(): Array<string> {
      return this.value
        .split(',')
        .map(part => part.trim())
        .filter(Boolean)
        .map(this.chipLabel);
    },
  },

  watch: {
    value(): void {
      this.$nextTick(this.resize);
    },
  },

  mounted() {
    this.resize();
  },

  methods: {
    menu(): AnchoredMenuRef {
      return this.$refs.menu as unknown as AnchoredMenuRef;
    },

    showMenu(): void {
      this.menu().show();
    },

    // Reopens on Up/Down when closed, like the chevron — items.length can't gate this since an exact-match value filters to zero.
    onArrowKey(open: boolean, event: KeyboardEvent): void {
      if (!open) {
        event.preventDefault();
        this.showAll(false);
      }
    },

    hideMenu(): void {
      this.menu().close();
    },

    resize(): void {
      const el = this.$refs.input as HTMLTextAreaElement | undefined;
      if (!el) {
        return;
      }

      el.style.height = 'auto';
      el.style.height = `${Math.max(el.scrollHeight, 30)}px`;
    },

    syncMenu(): void {
      if (this.suppressReopen) {
        this.suppressReopen = false;
        this.hideMenu();
        return;
      }

      if (this.items.length) {
        this.showMenu();
      } else {
        this.hideMenu();
      }
    },

    onInput(value: string): void {
      this.$emit('input', value);
      this.resize();
      // `items` updates on the parent's next render, so defer the open/close
      // decision until it reflects the new value.
      this.$nextTick(this.syncMenu);
    },

    onFocus(): void {
      this.focused = true;
      // The freshly-mounted textarea (see `chips` prop) starts pinned at
      // the static 30px CSS height until this resizes it to fit.
      this.resize();

      // Arrow keys bring focus back from the menu's items mid-session: keep
      // the menu as it is and put the caret at the end rather than
      // re-selecting everything.
      if (this.menu().open) {
        const input = this.$refs.input as HTMLTextAreaElement | undefined;
        input?.setSelectionRange(this.value.length, this.value.length);
        this.$emit('focus');
        return;
      }

      // Keys typed on the chips only land now: had they changed the value
      // while the chips were going away, leaving them would have applied it.
      if (this.typedAhead !== null) {
        this.$emit('input', this.typedAhead);
        this.typedAhead = null;
        this.startSession(false);
        return;
      }

      this.startSession(this.selectOnFocus && this.revealSelect);
      this.revealSelect = true;
    },

    // Begins editing in the (focused) field: selects the value if asked to,
    // then opens the menu once `items` reflect the consumer's reaction to
    // focus (e.g. listing everything while the value is untouched).
    startSession(select = this.selectOnFocus): void {
      if (select) {
        (this.$refs.input as HTMLTextAreaElement | undefined)?.select();
      }

      this.$emit('focus');
      this.$nextTick(this.syncMenu);
    },

    onBlur(): void {
      this.focused = false;
      this.keepSelectionOnMouseUp = false;
      this.$emit('blur');
    },

    onMouseDown(): void {
      this.keepSelectionOnMouseUp = this.selectOnFocus && !this.focused;
    },

    onMouseUp(event: MouseEvent): void {
      if (this.keepSelectionOnMouseUp) {
        event.preventDefault();
        this.keepSelectionOnMouseUp = false;
      }
    },

    // Switches from the pill display back to the raw editable textarea
    // and focuses it, once it exists on the next render.
    revealInput(): void {
      this.focused = true;
      this.$nextTick(() => {
        (this.$refs.input as HTMLTextAreaElement | undefined)?.focus();
      });
    },

    onSelect(item: Record<string, unknown>): void {
      this.$emit('select', item);
      this.finishCommit(this.pointerPick);
    },

    // Confirms the typed value, which may be a custom entry not in `items`.
    // Emitted before the blur that blur-on-commit triggers, so a consumer
    // that also applies on leave sees the value as already committed.
    onEnter(): void {
      this.$emit('submit', this.value);
      this.finishCommit();
    },

    finishCommit(quiet = false): void {
      this.pointerPick = false;

      if (this.blurOnCommit) {
        this.menu().close({ skipRestoreFocus: true });
        (this.$refs.input as HTMLTextAreaElement | undefined)?.blur();
        this.$nextTick(() => this.focusCommitted(quiet));
        return;
      }

      // The refocus-on-close would otherwise reopen the menu.
      this.suppressReopen = true;
      this.hideMenu();
    },

    // Keeps focus on the control once the committed value shows, so Tab
    // carries on from here: on the chips, or on the field without reopening
    // the menu when there's no value to show as chips.
    focusCommitted(quiet: boolean): void {
      const chips = this.$refs.chips as HTMLElement | undefined;

      if (chips) {
        this.quietFocus = quiet;
        chips.focus();
        return;
      }

      this.suppressReopen = true;
      this.revealSelect = false;
      (this.$refs.input as HTMLTextAreaElement | undefined)?.focus();
    },

    // Focusing the chips leaves the menu closed, like a select: Enter, Space
    // and the arrow keys start editing, and so does typing, from the typed
    // text (or after the value, when the field doesn't select on focus).
    onChipsKeydown(event: KeyboardEvent): void {
      this.quietFocus = false;

      if (event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }

      if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(event.key)) {
        event.preventDefault();
        this.revealInput();
      } else if (event.key.length === 1 || event.key === 'Backspace') {
        event.preventDefault();
        const text = this.typedAhead ?? (this.selectOnFocus ? '' : this.value);
        this.typedAhead =
          event.key === 'Backspace' ? text.slice(0, -1) : text + event.key;
        this.revealInput();
      }
    },

    // Escape / click-outside close the menu, leaving it to the consumer
    // (told which one) whether to keep the text as typed; the
    // refocus-on-close must not reopen it.
    onCancel(reason: 'escape' | 'outside'): void {
      this.suppressReopen = true;
      this.$emit('cancel', reason);
    },

    // Opens the menu from the chevron or Up/Down, like a click on the field:
    // the value is kept, and the consumer lists everything while it's
    // untouched. The chevron also re-selects the value like a click would;
    // the arrow keys leave the caret where the user was typing.
    showAll(select: boolean): void {
      this.suppressReopen = false;

      if (this.focused) {
        this.startSession(select && this.selectOnFocus);
      } else {
        this.revealInput();
      }
    },
  },
});
</script>

<style lang="scss" scoped>
.autocomplete {
  flex: 1;
  min-width: 0;
}

.autocomplete-pill {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 30px;
  min-width: 0;
  border: 1px solid var(--field-border-selector);
  border-radius: 9px;
  background: var(--field-fill);

  // Only the text field itself highlights the whole pill — the chevron
  // button gets its own focus ring instead (see .autocomplete-chevron).
  &:has(.autocomplete-input:focus),
  &:has(.autocomplete-chips:focus-visible:not(.quiet)) {
    @include field-active-border;
  }

  &.disabled {
    opacity: 0.6;
  }
}

.autocomplete-chips {
  box-sizing: border-box;
  flex: 1;
  min-width: 0;
  display: flex;
  flex-wrap: wrap;
  align-content: center;
  gap: 6px;
  padding: 5px 8px 5px 6px;
  cursor: text;
  outline: none;
}

.autocomplete-input {
  box-sizing: border-box;
  flex: 1;
  min-width: 0;
  height: 30px;
  border: none;
  outline: none;
  background: transparent;
  padding: 5px 0 5px 10px;
  margin: 0;
  resize: none;
  overflow: hidden;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  font: 400 12.5px/22px 'Geist', system-ui, sans-serif;
  color: var(--text-primary);

  &.mono {
    font-family: var(--font-mono);
    font-weight: 400;
  }

  &::placeholder {
    color: var(--text-muted);
  }

  &:disabled {
    opacity: 0.6;
  }
}

.autocomplete-chevron {
  @include button-reset;
  flex: none;
  align-self: stretch;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  border-left: 1px solid var(--field-border);
  border-radius: 0 8px 8px 0;
  outline: none;
  color: var(--text-muted);
  cursor: pointer;

  svg {
    transition: transform 0.15s ease;
  }

  &:hover:not(:disabled) {
    background: var(--hover-tint);
    color: var(--text-primary);
  }

  &.open svg {
    transform: rotate(180deg);
  }

  @include focus-ring;

  &:disabled {
    cursor: default;
  }
}

.autocomplete-menu {
  max-height: 240px !important;
  overflow-y: auto !important;
}

.autocomplete-option {
  display: contents;
}
</style>
