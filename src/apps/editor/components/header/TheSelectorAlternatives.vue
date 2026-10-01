<template>
  <div
    v-if="others.length"
    ref="row"
    class="selector-alternatives"
    :class="{ expanded }"
  >
    <s-chip
      v-for="selector in shown"
      :key="selector"
      :label="selector"
      variant="outline"
      size="small"
      class="selector-alternative"
      @click="choose(selector)"
      @mouseenter="preview(selector)"
      @mouseleave="clearPreview"
      @focus="preview(selector)"
      @blur="clearPreview"
    >
      <template v-if="styled.includes(selector)" #icon>
        <arrow-up-right-icon :size="11" />
      </template>
    </s-chip>
    <s-chip
      v-if="hiddenCount > 0"
      :label="t('count_more', [String(hiddenCount)])"
      variant="outline"
      size="small"
      class="selector-alternative more"
      @click="expanded = true"
    />

    <!-- Every chip at full width, unseen, to work out how many fit. -->
    <div ref="measure" class="selector-alternatives-measure" aria-hidden="true">
      <s-chip
        v-for="selector in others"
        :key="selector"
        :label="selector"
        variant="outline"
        size="small"
        class="measured"
      >
        <template v-if="styled.includes(selector)" #icon>
          <arrow-up-right-icon :size="11" />
        </template>
      </s-chip>
      <s-chip
        :label="t('count_more', [String(others.length)])"
        variant="outline"
        size="small"
        class="measured"
      />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { SChip } from '@stylebot/components';
import { ArrowUpRightIcon } from '@stylebot/icons';
import { getPageBridge } from '@stylebot/page-bridge';

const GAP = 6;

/**
 * Other selectors for the element just picked: ones the style already has,
 * marked with the same ↗ as other links to existing rules, then ones built
 * for it, broadest first, so the user can
 * widen or narrow the pick. Shown while the active selector is one of them;
 * typing or choosing something else hides it.
 */
export default Vue.extend({
  name: 'TheSelectorAlternatives',

  components: {
    ArrowUpRightIcon,
    SChip,
  },

  data(): {
    expanded: boolean;
    fitCount: number;
    resizeObserver: ResizeObserver | null;
  } {
    return {
      expanded: false,
      // How many chips fit on one line, from the unseen full-width copies.
      fitCount: 1,
      resizeObserver: null,
    };
  },

  computed: {
    // The style's own selectors lead, then the ones built for the element.
    styled(): Array<string> {
      return this.$store.state.selectorAlternatives.existing;
    },

    alternatives(): Array<string> {
      const { existing, candidates } = this.$store.state.selectorAlternatives;
      return [...existing, ...candidates];
    },

    activeSelector(): string {
      return this.$store.state.activeSelector;
    },

    others(): Array<string> {
      if (!this.alternatives.includes(this.activeSelector)) {
        return [];
      }

      return this.alternatives.filter(
        selector => selector !== this.activeSelector
      );
    },

    shown(): Array<string> {
      return this.expanded ? this.others : this.others.slice(0, this.fitCount);
    },

    hiddenCount(): number {
      return this.others.length - this.shown.length;
    },
  },

  watch: {
    alternatives(): void {
      this.expanded = false;
    },

    activeSelector(): void {
      this.expanded = false;
    },

    others(): void {
      this.$nextTick(this.observe);
    },
  },

  mounted() {
    this.observe();
  },

  beforeDestroy() {
    this.resizeObserver?.disconnect();
  },

  methods: {
    // The row only exists while there are alternatives, so (re)attach to it
    // whenever it may have appeared.
    observe(): void {
      this.resizeObserver?.disconnect();
      const { row } = this.$refs;

      if (row instanceof HTMLElement) {
        this.resizeObserver = new ResizeObserver(() => this.fit());
        this.resizeObserver.observe(row);
        this.fit();
      }
    },

    /**
     * Shows as many chips as fit at full width, leaving room for "+N" when
     * some don't; one that's wider than the row on its own is cut off.
     */
    fit(): void {
      const { row, measure } = this.$refs;

      if (!(row instanceof HTMLElement) || !(measure instanceof HTMLElement)) {
        return;
      }

      const style = getComputedStyle(row);
      const available =
        row.clientWidth -
        parseFloat(style.paddingLeft) -
        parseFloat(style.paddingRight);
      const chips = Array.from(measure.children) as Array<HTMLElement>;
      const more = chips.pop();
      const moreWidth = (more?.offsetWidth ?? 0) + GAP;
      let used = 0;
      let count = 0;

      for (const [index, chip] of chips.entries()) {
        const needsMore = index < chips.length - 1;
        const width = used + chip.offsetWidth + (needsMore ? moreWidth : 0);

        if (width > available) {
          break;
        }

        used += chip.offsetWidth + GAP;
        count++;
      }

      this.fitCount = Math.max(1, count);
    },

    choose(selector: string): void {
      this.clearPreview();
      this.$store.commit('setActiveSelector', selector);
    },

    preview(selector: string): void {
      getPageBridge().highlight(selector);
    },

    clearPreview(): void {
      getPageBridge().unhighlight();
    },
  },
});
</script>

<style lang="scss" scoped>
.selector-alternatives {
  position: relative;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: -4px;
  padding: 0 14px 10px 56px;

  &.expanded {
    flex-wrap: wrap;
  }
}

.selector-alternatives-measure {
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  gap: 6px;
  visibility: hidden;
  pointer-events: none;
}

.selector-alternative {
  flex: 0 1 auto;

  &.more {
    flex: none;
  }
}

.measured {
  flex: none;
}
</style>
