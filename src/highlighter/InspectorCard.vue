<template>
  <div class="inspect-card" :style="{ top: `${top}px`, left: `${left}px` }">
    <div v-if="placement" class="arrow" :class="placement" />

    <div class="row">
      <span class="chips">
        <s-chip v-for="(part, i) in nameChips" :key="i">{{ part }}</s-chip>
      </span>
      <span v-if="styleCount > 0" class="pill pill-accent">
        {{ styleCountLabel }}
      </span>
    </div>

    <div v-if="detailRows.length" class="details">
      <div v-for="row in detailRows" :key="row.label" class="detail-row">
        <div class="detail-label">{{ row.label }}</div>
        <div class="detail-value" :class="{ 'align-left': row.wraps }">
          <span
            v-if="row.swatch"
            class="swatch"
            :style="{ backgroundColor: row.swatch }"
          />
          {{ row.value }}
        </div>
      </div>
    </div>

    <div v-if="showMatchCount" class="matches-row">
      Matches {{ matchCountLabel }}
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
        <span v-if="nextAncestor.styleCount > 0" class="pill pill-accent">
          {{ ancestorStyleCountLabel }}
        </span>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { SChip, ShortcutChip } from '@stylebot/components';
import { splitSelectorList } from '@stylebot/css';
import { CssDeclaration } from '@stylebot/types';
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
    ShortcutChip,
  },

  data(): {
    name: string;
    matchCount: number | undefined;
    styleCount: number;
    declarations: Array<CssDeclaration> | null;
    nextAncestor: NextAncestorInfo | null;
    top: number;
    left: number;
    placement: 'above' | 'below' | null;
  } {
    return {
      name: '',
      matchCount: undefined,
      styleCount: 0,
      declarations: null,
      nextAncestor: null,
      top: 0,
      left: 0,
      placement: null,
    };
  },

  computed: {
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

    showMatchCount(): boolean {
      return this.matchCount !== undefined && this.matchCount > 1;
    },

    matchCountLabel(): string {
      return pluralize(this.matchCount ?? 0, 'element');
    },

    // Raw CSS property names, not prettified ones — this card is meant to
    // be read as the actual CSS rule, not a paraphrase of it.
    detailRows(): Array<{
      label: string;
      value: string;
      swatch: string | null;
      wraps: boolean;
    }> {
      return (this.declarations ?? []).map(({ property, value }) => ({
        label: property,
        // The quotes are needed in the actual CSS value but just add noise
        // in a list meant to be scanned, not copied.
        value: property === 'font-family' ? value.replace(/['"]/g, '') : value,
        swatch: property.toLowerCase().includes('color') ? value : null,
        // A font stack is the one value long enough to wrap; wrapped text
        // reads better left-aligned.
        wraps: property === 'font-family',
      }));
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

.pill {
  flex: none;
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 10.5px;
  font-weight: 500;
}

.pill-accent {
  background: color-mix(in srgb, var(--accent) 14%, transparent);
  color: var(--accent);
}

.details {
  display: flex;
  flex-flow: column nowrap;
  gap: 5px;
  margin-top: 9px;
}

.detail-row {
  display: flex;
  flex-flow: row nowrap;
  align-items: baseline;
  gap: 12px;
}

.detail-label {
  flex: none;
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
  flex: 1;
  min-width: 0;
  overflow-wrap: break-word;
  text-align: right;
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

.detail-value.align-left {
  flex: 0 1 auto;
  margin-left: auto;
  text-align: left;
  line-height: 1.6;
}

.swatch {
  display: inline-block;
  width: 9px;
  height: 9px;
  border-radius: 2px;
  border: 1px solid var(--panel-border);
  margin-right: 4px;
  vertical-align: middle;
}

.matches-row {
  margin-top: 10px;
  color: var(--text-secondary);
}

.divider {
  height: 1px;
  margin: 14px 0 12px;
  background: var(--panel-border);
}
</style>
