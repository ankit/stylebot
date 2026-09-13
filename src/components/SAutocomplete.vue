<template>
  <anchored-menu
    ref="menu"
    class="autocomplete"
    retain-focus
    @cancel="onCancel"
  >
    <template #trigger="{ open }">
      <div class="autocomplete-pill" :class="{ disabled }">
        <div
          v-if="chips && !focused && !open && chipParts.length"
          class="autocomplete-chips"
          @mousedown.prevent="revealInput"
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
          @input="onInput($event.target.value)"
        />

        <slot name="suffix" />

        <button
          type="button"
          class="autocomplete-chevron"
          :class="{ open }"
          :disabled="disabled"
          @click="open ? hideMenu() : showAll()"
        >
          <chevron-down-icon />
        </button>
      </div>
    </template>

    <s-menu dense :min-width="minWidth" class="autocomplete-menu">
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
import Vue, { PropType } from 'vue';

import { ChevronDownIcon } from '@stylebot/icons';

import AnchoredMenu from './AnchoredMenu.vue';
import SMenu from './SMenu.vue';
import SChip from './SChip.vue';

type AnchoredMenuRef = { show(): void; close(): void };

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
  },

  data(): { suppressReopen: boolean; previousValue: string; focused: boolean } {
    return {
      suppressReopen: false,
      // Value to revert to on Escape / click-outside — captured at the start
      // of each editing session (focus / chevron-open).
      previousValue: '',
      focused: false,
    };
  },

  computed: {
    chipParts(): Array<string> {
      return this.value
        .split(',')
        .map(part => part.trim())
        .filter(Boolean);
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
      return (this.$refs.menu as unknown) as AnchoredMenuRef;
    },

    showMenu(): void {
      this.menu().show();
    },

    // Reopens on Up/Down when closed, like the chevron — items.length can't gate this since an exact-match value filters to zero.
    onArrowKey(open: boolean, event: KeyboardEvent): void {
      if (!open) {
        event.preventDefault();
        this.showAll();
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
      this.previousValue = this.value;
      this.syncMenu();
    },

    onBlur(): void {
      this.focused = false;
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
      this.suppressReopen = true;
      this.$emit('select', item);
      this.hideMenu();
    },

    onEnter(): void {
      // Confirm the typed value (which may be a custom entry not in `items`):
      // keep it, close, and make it the new revert baseline.
      this.suppressReopen = true;
      this.previousValue = this.value;
      this.hideMenu();
      this.$emit('submit', this.value);
    },

    onCancel(): void {
      // Escape / click-outside revert to the value from before this editing
      // session and keep the menu closed (the refocus-on-close would otherwise
      // reopen it). Enter (onEnter) commits instead.
      this.suppressReopen = true;
      this.$emit('input', this.previousValue);
    },

    showAll(): void {
      this.previousValue = this.value;
      this.suppressReopen = false;
      this.$emit('input', '');
      this.$nextTick(this.showMenu);
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
  @include field-border(9px);
  background: var(--background);

  // Only the text field itself highlights the whole pill — the chevron
  // button gets its own focus ring instead (see .autocomplete-chevron).
  &:has(.autocomplete-input:focus) {
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
  padding: 6px 8px 6px 6px;
  cursor: text;
}

.autocomplete-input {
  box-sizing: border-box;
  flex: 1;
  min-width: 0;
  height: 30px;
  border: none;
  outline: none;
  background: transparent;
  padding: 6px 0 4px 10px;
  margin: 0;
  resize: none;
  overflow: hidden;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  font: 400 12.5px/22px 'Public Sans', system-ui, sans-serif;
  color: var(--foreground);

  &.mono {
    font-family: var(--font-mono);
    font-weight: 600;
  }

  &::placeholder {
    color: var(--muted-foreground);
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
  border-left: 1px solid var(--input);
  border-radius: 0 8px 8px 0;
  outline: none;
  color: var(--muted-foreground);
  cursor: pointer;

  svg {
    transition: transform 0.15s ease;
  }

  &:hover:not(:disabled) {
    background: var(--accent);
    color: var(--foreground);
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
