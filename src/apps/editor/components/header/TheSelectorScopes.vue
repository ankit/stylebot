<template>
  <div
    v-if="options.length"
    class="selector-scopes"
    @mouseover="preview"
    @mouseleave="clearPreview"
  >
    <s-segmented-control
      fit
      size="medium"
      :aria-label="t('how_much_to_style')"
      :value="activeSelector"
      :options="options"
      @change="pick"
    >
      <template #option="{ option }">
        {{ option.label }}
        <span class="scope-count">{{ option.count }}</span>
      </template>
    </s-segmented-control>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { SSegmentedControl } from '@stylebot/components';
import type { SelectorAlternatives } from '@stylebot/page-bridge';
import { getPageBridge } from '@stylebot/page-bridge';

import { countSelectorMatches } from '../../utils/selector-matches';
import { getScopeSlots } from '../../utils/selector-scopes';
import type { ScopeSlots } from '../../utils/selector-scopes';

type ScopeOption = { value: string; label: string; count: string };

const SLOTS: Array<keyof ScopeSlots> = ['only', 'similar', 'all'];

export default Vue.extend({
  name: 'TheSelectorScopes',

  components: {
    SSegmentedControl,
  },

  data(): {
    counts: Record<string, number | null>;
    previewing: string | null;
  } {
    return { counts: {}, previewing: null };
  },

  computed: {
    activeSelector(): string {
      return this.$store.state.activeSelector;
    },

    alternatives(): SelectorAlternatives {
      return this.$store.state.selectorAlternatives;
    },

    slots(): ScopeSlots {
      return getScopeSlots(this.alternatives, this.counts);
    },

    /**
     * Whether the field holds the inspector's pick or one of the pills',
     * rather than being cleared or holding a selector typed by hand.
     */
    showing(): boolean {
      const selector = this.activeSelector;

      return (
        !!selector &&
        (selector === this.alternatives.selector ||
          SLOTS.some(slot => this.slots[slot] === selector))
      );
    },

    /**
     * The scopes that have a selector, narrowest first.
     */
    options(): Array<ScopeOption> {
      const shown = this.$store.state.options.mode === 'basic' && this.showing;
      if (!shown) {
        return [];
      }

      return SLOTS.flatMap(slot => {
        const selector = this.slots[slot];
        if (!selector) {
          return [];
        }

        return [
          {
            value: selector,
            label: this.t(`selector_scope_${slot}`),
            count: String(this.counts[selector] ?? ''),
          },
        ];
      });
    },
  },

  watch: {
    alternatives: {
      immediate: true,
      async handler(alternatives: SelectorAlternatives): Promise<void> {
        const { candidates } = alternatives;
        const counts = candidates.length
          ? await countSelectorMatches(candidates)
          : {};

        if (alternatives === this.alternatives) {
          this.counts = counts;
        }
      },
    },
  },

  beforeDestroy() {
    this.clearPreview();
  },

  methods: {
    pick(selector: string): void {
      // The flash that follows ends the preview; let the next move redraw it.
      this.previewing = null;
      this.$store.commit('setActiveSelector', selector);
    },

    /**
     * Highlights what the hovered pill would style, redrawing only when the
     * pill changes, and clears it once the pointer is past the pills; the
     * gaps between them keep it, so crossing one doesn't flicker.
     */
    preview(event: MouseEvent): void {
      const target = event.target as HTMLElement;
      const segment = target.closest('.segment');
      const segments = Array.from(this.$el.querySelectorAll('.segment'));
      const option = this.options[segments.indexOf(segment as Element)];

      if (option) {
        if (option.value !== this.previewing) {
          this.previewing = option.value;
          getPageBridge().highlight(option.value);
        }

        return;
      }

      if (!target.closest('.segmented')) {
        this.clearPreview();
      }
    },

    clearPreview(): void {
      if (this.previewing !== null) {
        this.previewing = null;
        getPageBridge().unhighlight();
      }
    },
  },
});
</script>

<style lang="scss" scoped>
.selector-scopes {
  display: flex;
  min-width: 0;

  ::v-deep .segmented {
    gap: 2px;
    padding: 0;
    background: transparent;
  }

  ::v-deep .segmented .segment-indicator {
    display: none;
  }

  ::v-deep .segmented .segment {
    justify-items: start;
    height: 24px;
    padding: 0 11px;
    border-radius: 6px;
    background: transparent;
    font-size: 12.5px;
    font-weight: 500;
    color: var(--text-secondary);
    cursor: pointer;

    &:hover:not(.active) {
      background: color-mix(in srgb, var(--text-primary) 7%, transparent);
      color: var(--text-primary);
    }

    .scope-count {
      margin-left: 4px;
      font-variant-numeric: tabular-nums;
      font-weight: 400;
      color: var(--text-muted);
    }

    &.active {
      background: var(--field-surface-hover);
      color: var(--text-primary);
      font-weight: 500;

      @include dark-mode {
        background: var(--field-surface-active);
      }
    }
  }
}
</style>
