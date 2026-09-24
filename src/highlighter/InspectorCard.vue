<template>
  <div
    v-show="hasContent"
    class="inspect-card"
    :style="{ top: `${top}px`, left: `${left}px` }"
  >
    <div v-if="placement" class="arrow" :class="placement" />

    <div v-if="showSelector || styleCount > 0" class="row">
      <span v-if="showSelector" class="chips">
        <s-chip v-for="(part, i) in nameChips" :key="i">{{ part }}</s-chip>
      </span>
      <s-count-badge v-if="styleCount > 0" :count="styleCount">
        {{ styleCountLabel }}
      </s-count-badge>
    </div>

    <div v-if="detailRows.length" class="details">
      <div v-for="row in detailRows" :key="row.label" class="detail-row">
        <div class="detail-label">{{ row.label }}</div>
        <div class="detail-value">
          <span
            v-if="row.swatch"
            class="swatch"
            :style="{ backgroundColor: row.swatch }"
          />
          {{ row.value }}
        </div>
      </div>
      <div v-if="hiddenDeclarationCount > 0" class="detail-more">
        {{ t('count_more', [String(hiddenDeclarationCount)]) }}
      </div>
    </div>

    <template v-if="nextAncestor">
      <div class="divider" />
      <div class="row next-row">
        <shortcut-chip value="arrowup" small />
        <span class="chips">
          <s-chip v-for="(part, i) in ancestorChips" :key="i">
            {{ part }}
          </s-chip>
        </span>
        <s-count-badge
          v-if="nextAncestor.styleCount > 0"
          :count="nextAncestor.styleCount"
        >
          {{ ancestorStyleCountLabel }}
        </s-count-badge>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { SChip, SCountBadge, ShortcutChip } from '@stylebot/components';
import { splitSelectorList } from '@stylebot/css';
import { CssDeclaration } from '@stylebot/types';

const MAX_DETAIL_ROWS = 4;
type NextAncestorInfo = { label: string; styleCount: number };

function pluralize(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}

/**
 * Mounted by OverlayTip (Overlay.ts) into the editor's theme-provider subtree,
 * which is what gives it the editor's CSS variables and fonts over the page.
 */
export default Vue.extend({
  name: 'InspectorCard',

  components: {
    SChip,
    SCountBadge,
    ShortcutChip,
  },

  data(): {
    name: string;
    // Off for selector previews beside the panel, where the selector is
    // already visible in the dropdown row or input being previewed.
    showSelector: boolean;
    styleCount: number;
    declarations: Array<CssDeclaration> | null;
    nextAncestor: NextAncestorInfo | null;
    top: number;
    left: number;
    placement: 'above' | 'below' | null;
  } {
    return {
      name: '',
      showSelector: true,
      styleCount: 0,
      declarations: null,
      nextAncestor: null,
      top: 0,
      left: 0,
      placement: null,
    };
  },

  computed: {
    hasContent(): boolean {
      return (
        this.showSelector || this.styleCount > 0 || this.nextAncestor !== null
      );
    },

    nameChips(): Array<string> {
      return splitSelectorList(this.name);
    },

    ancestorChips(): Array<string> {
      return this.nextAncestor
        ? splitSelectorList(this.nextAncestor.label)
        : [];
    },

    styleCountLabel(): string {
      return pluralize(this.styleCount, 'style');
    },

    ancestorStyleCountLabel(): string {
      return this.nextAncestor
        ? pluralize(this.nextAncestor.styleCount, 'style')
        : '';
    },

    // Raw CSS property names, not prettified ones — this card is meant to
    // be read as the actual CSS rule, not a paraphrase of it.
    detailRows(): Array<{
      label: string;
      value: string;
      swatch: string | null;
    }> {
      return (this.declarations ?? [])
        .slice(0, MAX_DETAIL_ROWS)
        .map(({ property, value }) => ({
          label: property,
          // The quotes are needed in the actual CSS value but just add noise
          // in a list meant to be scanned, not copied.
          value:
            property === 'font-family' ? value.replace(/['"]/g, '') : value,
          swatch: property.toLowerCase().includes('color') ? value : null,
        }));
    },

    hiddenDeclarationCount(): number {
      return Math.max(0, (this.declarations?.length ?? 0) - MAX_DETAIL_ROWS);
    },
  },
});
</script>

<style lang="scss" scoped>
.inspect-card {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 2147483647;
  display: flex;
  flex-flow: column nowrap;
  min-width: 240px;
  max-width: 320px;
  padding: 12px 14px 13px;
  border-radius: 12px;
  border: 1px solid var(--panel-border);
  background: var(--card-surface);
  box-shadow: 0 14px 32px var(--panel-shadow);
  font-size: 12px;
  line-height: 1.35;
  color: var(--text-primary);
  pointer-events: none;
}

.arrow {
  position: absolute;
  left: 16px;
  width: 12px;
  height: 12px;
  background: var(--card-surface);
  border-radius: 2px;
  transform: rotate(45deg);

  &.below {
    top: -6px;
    border-left: 1px solid var(--panel-border);
    border-top: 1px solid var(--panel-border);
  }

  &.above {
    bottom: -6px;
    border-right: 1px solid var(--panel-border);
    border-bottom: 1px solid var(--panel-border);
  }
}

.row {
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
  gap: 8px;
}

.chips {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-flow: row wrap;
  gap: 6px;
}

.chips ::v-deep .chip {
  font-weight: 500;
  color: var(--text-secondary);
}

.details {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  column-gap: 16px;
  row-gap: 5px;
  margin-top: 9px;
}

.detail-row {
  display: contents;
}

.detail-label {
  white-space: nowrap;
  font-family: var(
    --font-mono,
    'Fira Code',
    Menlo,
    Monaco,
    Consolas,
    monospace
  );
  color: var(--text-secondary);
}

.detail-value {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  overflow-wrap: anywhere;
  font-family: var(
    --font-mono,
    'Fira Code',
    Menlo,
    Monaco,
    Consolas,
    monospace
  );
  color: var(--text-secondary);
}

.swatch {
  flex: none;
  width: 9px;
  height: 9px;
  border-radius: 2px;
  border: 1px solid var(--panel-border);
}

.detail-more {
  grid-column: 1 / -1;
  color: var(--text-secondary);
}

.divider {
  height: 1px;
  margin: 14px 0 12px;
  background: var(--panel-border);
}
</style>
