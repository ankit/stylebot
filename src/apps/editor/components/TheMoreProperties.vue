<template>
  <div class="more-properties">
    <s-tooltip
      v-for="row in visibleRows"
      :key="rowKey(row)"
      :text="`${row.property}: ${row.value}`"
      :disabled="truncatedRow !== rowKey(row)"
      grow
      @mouseenter.native="measureTruncation($event, row)"
    >
      <template #text>
        <span class="more-property-tooltip">
          {{ row.property }}: {{ row.value }}
        </span>
      </template>
      <div class="more-property-row" :class="{ page: !row.own }">
        <span class="more-property-key">{{ row.property }}</span>
        <input
          class="more-property-value"
          :value="row.own ? row.value : ''"
          :placeholder="row.own ? '' : row.value"
          :aria-label="row.property"
          :disabled="disabled"
          spellcheck="false"
          @keydown.enter="blur"
          @keydown.esc="revert($event, row)"
          @change="commit(row, $event.target.value)"
        />
        <button
          v-if="row.own"
          type="button"
          class="more-property-remove"
          :aria-label="t('remove')"
          @click="remove(row.property)"
        >
          <x-icon :size="14" />
        </button>
      </div>
    </s-tooltip>

    <button
      v-if="hiddenPageRowCount > 0 || expanded"
      type="button"
      class="more-properties-toggle"
      @click="expanded = !expanded"
    >
      {{ expanded ? t('show_less') : t('show_all') }}
    </button>

    <div v-if="adding" class="add-property-row" @focusout="onAddFocusOut">
      <input
        ref="keyInput"
        v-model="newProperty"
        class="add-property-input"
        :placeholder="t('property')"
        :aria-label="t('property')"
        spellcheck="false"
        @keydown.enter.prevent="focusValue"
        @keydown.esc="cancelAdd"
      />
      <input
        ref="valueInput"
        v-model="newValue"
        class="add-property-input"
        :placeholder="t('value')"
        :aria-label="t('value')"
        spellcheck="false"
        @keydown.enter="commitAdd"
        @keydown.esc="cancelAdd"
      />
      <button
        type="button"
        class="more-property-remove"
        :aria-label="t('cancel')"
        @click="cancelAdd"
      >
        <x-icon :size="14" />
      </button>
    </div>

    <button
      v-else
      type="button"
      class="add-property-button"
      :disabled="disabled"
      @click="startAdd"
    >
      {{ t('add_property') }}
    </button>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import type { Declaration } from 'postcss';

import { XIcon } from '@stylebot/icons';
import { STooltip } from '@stylebot/components';
import type { CssDeclaration } from '@stylebot/types';

import { KNOWN_PROPERTIES } from '../utils/basic-properties';
import { getPageRows } from '../utils/page-rows';

const MAX_PAGE_ROWS = 6;

type Row = CssDeclaration & { own: boolean };

export default Vue.extend({
  name: 'TheMoreProperties',

  components: {
    STooltip,
    XIcon,
  },

  data(): {
    adding: boolean;
    newProperty: string;
    newValue: string;
    expanded: boolean;
    truncatedRow: string | null;
  } {
    return {
      adding: false,
      truncatedRow: null,
      expanded: false,
      newProperty: '',
      newValue: '',
    };
  },

  computed: {
    ruleDeclarations(): Array<CssDeclaration> {
      const activeRule = this.$store.getters.activeRule;
      const declarations: Array<CssDeclaration> = [];

      activeRule?.walkDecls((decl: Declaration) => {
        declarations.push({ property: decl.prop, value: decl.value });
      });

      return declarations;
    },

    ownRows(): Array<Row> {
      return this.ruleDeclarations
        .filter(({ property }) => !KNOWN_PROPERTIES.includes(property))
        .map(declaration => ({ ...declaration, own: true }));
    },

    // The page's own CSS for properties no control, rule here or winning
    // Stylebot rule covers, most visual first, to edit in place.
    pageRows(): Array<Row> {
      const { pageDeclarations, appliedDeclarations } = this.$store.state;
      const covered = [
        ...KNOWN_PROPERTIES,
        ...this.ruleDeclarations.map(({ property }) => property),
        ...appliedDeclarations.map(({ property }: CssDeclaration) => property),
      ];

      return getPageRows(pageDeclarations, covered).map(declaration => ({
        ...declaration,
        own: false,
      }));
    },

    visibleRows(): Array<Row> {
      return [
        ...this.ownRows,
        ...(this.expanded
          ? this.pageRows
          : this.pageRows.slice(0, MAX_PAGE_ROWS)),
      ];
    },

    hiddenPageRowCount(): number {
      return Math.max(0, this.pageRows.length - MAX_PAGE_ROWS);
    },

    disabled(): boolean {
      return !this.$store.state.activeSelector;
    },
  },

  methods: {
    rowKey(row: Row): string {
      return `${row.own}-${row.property}`;
    },

    blur(event: KeyboardEvent): void {
      (event.target as HTMLInputElement).blur();
    },

    /**
     * Notes the row under the pointer when its name or value is cut off, so
     * its tooltip shows the whole declaration.
     */
    measureTruncation(event: MouseEvent, row: Row): void {
      const el = (event.currentTarget as HTMLElement).firstElementChild;
      const truncated = Array.from(el?.children ?? []).some(
        child => child.scrollWidth > child.clientWidth
      );

      this.truncatedRow = truncated ? this.rowKey(row) : null;
    },

    revert(event: KeyboardEvent, row: Row): void {
      const input = event.target as HTMLInputElement;
      input.value = row.own ? row.value : '';
      input.blur();
    },

    // Emptying a row of this rule removes it; a page row only takes a value.
    commit(row: Row, input: string): void {
      const value = input.trim();

      if (value || row.own) {
        this.$store.dispatch('applyDeclaration', {
          property: row.property,
          value,
        });
      }
    },

    remove(property: string): void {
      this.$store.dispatch('applyDeclaration', { property, value: '' });
    },

    startAdd(): void {
      this.adding = true;
      this.newProperty = '';
      this.newValue = '';

      this.$nextTick(() => {
        (this.$refs.keyInput as HTMLInputElement | undefined)?.focus();
      });
    },

    focusValue(): void {
      (this.$refs.valueInput as HTMLInputElement | undefined)?.focus();
    },

    cancelAdd(): void {
      this.adding = false;
    },

    // Clicking away before naming the property abandons it.
    onAddFocusOut(event: FocusEvent): void {
      const row = event.currentTarget as HTMLElement;

      if (
        !row.contains(event.relatedTarget as Node | null) &&
        !this.newProperty.trim()
      ) {
        this.cancelAdd();
      }
    },

    commitAdd(): void {
      const property = this.newProperty.trim();
      const value = this.newValue.trim();

      if (!property || !value) {
        return;
      }

      this.$store.dispatch('applyDeclaration', { property, value });
      this.adding = false;
    },
  },
});
</script>

<style lang="scss" scoped>
.more-property-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 28px;
  align-items: center;
  gap: 10px;
  height: 30px;
  margin: 0 -8px;
  padding: 0 1px 0 8px;
  border-radius: 6px;

  &:hover {
    background: var(--field-surface);
  }
}

.more-property-key {
  @include truncate;

  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-body);
}

.more-property-tooltip {
  font-family: var(--font-mono);
}

.more-property-value {
  box-sizing: border-box;
  min-width: 0;
  height: 24px;
  margin-left: -7px;
  padding: 0 6px;
  border: none;
  border-radius: 5px;
  background: transparent;
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--field-ink);
  text-overflow: ellipsis;
  outline: none;

  &::placeholder {
    color: var(--field-placeholder);
  }

  &:focus {
    background: var(--field-fill);
    box-shadow: inset 0 0 0 1px var(--accent);
    color: var(--field-ink);
  }
}

.more-property-remove {
  @include button-reset;

  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 7px;
  color: var(--text-secondary);
  cursor: pointer;

  &:hover {
    background: var(--field-surface-hover);
    color: var(--field-ink);
  }

  .more-property-row &:not(:focus-visible) {
    opacity: 0;
  }

  .more-property-row:hover & {
    opacity: 1;
  }

  @include focus-ring;
}

.more-properties-toggle {
  @include button-reset;

  margin-top: 4px;
  font-size: 12px;
  color: var(--text-muted);
  cursor: pointer;

  &:hover {
    color: var(--text-primary);
  }

  @include focus-ring;
}

.add-property-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) 28px;
  align-items: center;
  gap: 6px;
  margin: 6px -4px 0;
}

.add-property-input {
  box-sizing: border-box;
  min-width: 0;
  height: 28px;
  padding: 0 8px;
  border: none;
  border-radius: 7px;
  background: var(--field-surface);
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--field-ink);
  outline: none;

  &::placeholder {
    color: var(--field-placeholder);
  }

  &:focus {
    box-shadow: 0 0 0 1.5px var(--accent);
  }
}

.add-property-button {
  @include button-reset;

  display: flex;
  align-items: center;
  justify-content: center;
  width: calc(100% + 8px);
  height: 28px;
  margin: 6px -4px 0;
  border-radius: 7px;
  background: var(--field-surface);
  font-size: 12.5px;
  color: var(--text-body);
  cursor: pointer;

  &:hover:not(:disabled) {
    background: var(--field-surface-hover);
  }

  &:disabled {
    cursor: default;
    opacity: 0.6;
  }

  @include focus-ring;
}
</style>
