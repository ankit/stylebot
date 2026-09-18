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

type StylebotDeclaration = { property: string; value: string };
type NextAncestorInfo = { label: string; styleCount: number };

// Splits a (possibly grouped) selector into its comma-separated parts —
// the same split TheCssSelectorDropdownItem.vue does to show a selector as
// pills, reused here so the card's own selectors look the same way.
function splitSelector(selector: string): Array<string> {
  return selector
    .split(',')
    .map(part => part.trim())
    .filter(Boolean);
}

function pluralize(count: number, word: string): string {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}

// Rendered by Overlay.ts as a standalone Vue instance, mounted into the
// editor's own theme-provider subtree (not passed here as props) — see
// OverlayTip in Overlay.ts. That's what lets this component use the same
// CSS variables (--accent, --text-primary, --font-mono, ...) and 'Geist'
// base font as the rest of the editor, despite rendering over the page
// itself rather than inside the editor panel.
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
    declarations: Array<StylebotDeclaration> | null;
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
      return splitSelector(this.name);
    },

    ancestorChips(): Array<string> {
      return this.nextAncestor ? splitSelector(this.nextAncestor.label) : [];
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
        // A font stack is the one value long enough to wrap — right-aligned
        // wrapped text is ragged on the side you read from, so it gets
        // left-aligned instead once it needs more than one line.
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
  // Above the editor panel itself (TheStylebotResizer.vue sets z: 1e8),
  // so the card is never visually cut off by it even if positioning
  // still lands it nearby.
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
  // The card follows the cursor while inspecting, so nothing in it can be
  // hovered or clicked — climbing to the parent is done with the keyboard
  // (ArrowUp/ArrowLeft), not by clicking a row here.
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

// Same shape as TheCssSelectorDropdownItem.vue's own .chips — each part of
// a (possibly grouped) selector as its own pill, wrapping instead of
// truncating. SChip supplies its own code font, so nothing extra needed
// here for that.
.chips {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-flow: row wrap;
  gap: 6px;
}

// A bit bolder than SChip's own default (400) — the selector is the one
// thing in the card worth making the most prominent. 500 is one of the
// weights self-hosted for Fira Code (init-editor.ts); anything else would
// synthesize a fake bold instead of rendering a real one.
.chips ::v-deep .chip {
  font-weight: 500;
  // Dimmed from SChip's own text-primary (near-white in dark mode) to
  // text-secondary, matching the detail values below.
  color: var(--text-secondary);
}

// Smaller and lighter than SCountBadge (used for the same kind of count
// elsewhere, e.g. the editor header's active-style-count) — a compact
// pill fits better inline next to the selector than the default size.
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
  // Raw CSS property names read as code, not prose, so they get the same
  // font as everything else CSS-shaped in the card.
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
  // Falls back explicitly rather than relying solely on --font-mono being
  // in scope, since this card renders outside the editor panel proper.
  font-family: var(
    --font-mono,
    'Fira Code',
    Menlo,
    Monaco,
    Consolas,
    monospace
  );
  // text-secondary rather than text-primary (near-white in dark mode) —
  // still a real editor token, just dimmer for a value that isn't the
  // card's main subject.
  color: var(--text-secondary);
}

.detail-value.align-left {
  // Shrinks to its content and hugs the right edge via the auto margin,
  // rather than stretching across the row's full remaining width — so the
  // block still sits flush right like every other value, even though the
  // text inside it reads left-to-right once it wraps.
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

// A plain sentence rather than a label/value row — it's not a CSS
// property, so it doesn't get the code font or the right-aligned value
// column the way the declaration rows above it do.
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
