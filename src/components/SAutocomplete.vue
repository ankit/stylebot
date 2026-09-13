<template>
  <anchored-menu
    ref="menu"
    class="autocomplete"
    retain-focus
    @cancel="onCancel"
  >
    <template #trigger="{ open }">
      <div class="autocomplete-pill" :class="{ disabled }">
        <textarea
          ref="input"
          rows="1"
          class="autocomplete-input"
          :class="{ mono }"
          :disabled="disabled"
          :value="value"
          :placeholder="placeholder"
          spellcheck="false"
          @keydown.enter.prevent="onEnter"
          @focus="onFocus"
          @input="onInput($event.target.value)"
        />

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

type AnchoredMenuRef = { show(): void; close(): void };

export default Vue.extend({
  name: 'SAutocomplete',

  components: {
    AnchoredMenu,
    SMenu,
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
  },

  data(): { suppressReopen: boolean; previousValue: string } {
    return {
      suppressReopen: false,
      // Value to revert to on Escape / click-outside — captured at the start
      // of each editing session (focus / chevron-open).
      previousValue: '',
    };
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
      this.previousValue = this.value;
      this.syncMenu();
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
  border: 1px solid var(--input);
  border-radius: 9px;
  background: var(--background);

  // Only the text field itself highlights the whole pill — the chevron
  // button gets its own focus ring instead (see .autocomplete-chevron).
  &:has(.autocomplete-input:focus) {
    border-color: var(--primary);
    box-shadow: inset 0 0 0 1px var(--primary);
  }

  &.disabled {
    opacity: 0.6;
  }
}

.autocomplete-input {
  box-sizing: border-box;
  flex: 1;
  min-width: 0;
  height: 30px;
  border: none;
  outline: none;
  background: transparent;
  padding: 0 0 0 10px;
  margin: 0;
  resize: none;
  overflow: hidden;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  font: 400 12.5px/32px 'Public Sans', system-ui, sans-serif;
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
