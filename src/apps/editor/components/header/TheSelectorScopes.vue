<template>
  <div v-if="options.length === 1" class="selector-scopes">
    <span
      v-if="current.count"
      class="scope-trigger single"
      @mouseenter="preview(current.value)"
      @mouseleave="clearPreview"
    >
      {{ elementsCount }}
    </span>
  </div>

  <s-anchored-menu
    v-else-if="options.length"
    class="selector-scopes"
    @close="clearPreview"
  >
    <template #trigger="{ toggle, open }">
      <s-tooltip :text="t('how_much_to_style')" :disabled="open">
        <button
          type="button"
          class="scope-trigger"
          :class="{ open }"
          aria-haspopup="menu"
          :aria-expanded="open ? 'true' : 'false'"
          @click="toggle"
        >
          <span class="scope-label">{{ current.title }}</span>
          <span v-if="current.count" class="scope-count">
            {{ current.count }}
          </span>
          <chevron-down-icon :size="10" class="scope-chevron" />
        </button>
      </s-tooltip>
    </template>

    <template #default="{ close }">
      <s-menu
        :aria-label="t('how_much_to_style')"
        dense
        size="small"
        :min-width="170"
        @mouseleave.native="clearPreview"
      >
        <s-menu-item
          v-for="option in options"
          :key="option.value"
          :selected="option.value === activeSelector"
          @mouseenter.native="preview(option.value)"
          @focus.native="preview(option.value)"
          @click="
            pick(option.value);
            close();
          "
        >
          <span class="scope-option">
            <span class="scope-label">{{ option.title }}</span>
            <span class="scope-count">{{ option.count }}</span>
          </span>
        </s-menu-item>
      </s-menu>
    </template>
  </s-anchored-menu>
</template>

<script lang="ts">
import Vue from 'vue';
import {
  SAnchoredMenu,
  SMenu,
  SMenuItem,
  STooltip,
} from '@stylebot/components';
import { ChevronDownIcon } from '@stylebot/icons';
import { getPageBridge } from '@stylebot/page-bridge';

import { getScopeSlots } from '@stylebot/css';
import type { ScopeSlots, SelectorAlternatives } from '@stylebot/css';

import { isPeeking, stopPeek } from '../../utils/selector-peek';

type Slot = keyof ScopeSlots;

type ScopeOption = {
  value: string;
  title: string;
  count: string;
};

const SLOTS: Array<Slot> = ['only', 'similar', 'all'];

export default Vue.extend({
  name: 'TheSelectorScopes',

  components: {
    ChevronDownIcon,
    SAnchoredMenu,
    SMenu,
    SMenuItem,
    STooltip,
  },

  data(): { previewing: string | null } {
    return { previewing: null };
  },

  computed: {
    activeSelector(): string {
      return this.$store.state.activeSelector;
    },

    alternatives(): SelectorAlternatives {
      return this.$store.state.selectorAlternatives;
    },

    slots(): ScopeSlots {
      return getScopeSlots(this.alternatives);
    },

    /**
     * Whether the field holds one of the scopes' selectors, rather than being
     * cleared or holding a selector typed by hand.
     */
    showing(): boolean {
      const selector = this.activeSelector;

      return !!selector && SLOTS.some(slot => this.slots[slot] === selector);
    },

    /**
     * The scopes that have a selector, narrowest first.
     */
    options(): Array<ScopeOption> {
      const shown = !this.$store.getters.readabilityActive && this.showing;
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
            title: this.t(`selector_scope_${slot}`),
            count: String(this.alternatives.counts?.[selector] ?? ''),
          },
        ];
      });
    },

    // The single scope's reach in words, e.g. "30 elements".
    elementsCount(): string {
      const count = Number(this.current.count);

      return this.t(
        count === 1 ? 'elements_count_one' : 'elements_count_other',
        [this.current.count]
      );
    },

    current(): ScopeOption {
      return (
        this.options.find(option => option.value === this.activeSelector) ??
        this.options[0]
      );
    },
  },

  beforeDestroy() {
    this.clearPreview();
  },

  methods: {
    pick(selector: string): void {
      this.$store.commit('setActiveSelector', selector);
    },

    /**
     * Highlights what the hovered scope would style, unless the field is
     * already peeking at that selector.
     */
    preview(selector: string): void {
      const peeking = isPeeking() && selector === this.activeSelector;

      if (selector !== this.previewing && !peeking) {
        stopPeek();
        this.previewing = selector;
        getPageBridge().highlight(selector);
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
}

.scope-trigger {
  @include button-reset;

  display: flex;
  align-items: center;
  gap: 5px;
  height: 26px;
  padding: 0 7px 0 8px;
  border-radius: 6px;
  font-size: 12.5px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;

  &:hover:not(.single),
  &.open {
    background: var(--hover-tint);
    color: var(--text-primary);
  }

  &:hover .scope-chevron,
  &.open .scope-chevron {
    color: var(--text-primary);
  }

  &.single {
    padding-right: 7px;
    font-weight: 400;
    color: var(--text-muted);
    cursor: default;
  }

  @include focus-ring($target: ':not(.open)');
}

.scope-count {
  font-variant-numeric: tabular-nums;
  font-weight: 400;
  color: var(--text-muted);
}

.scope-chevron {
  flex: none;
  color: var(--text-muted);
}

.scope-option {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;

  .scope-label {
    flex: 1;
  }
}

.menu-item:not(.selected) .scope-option .scope-count {
  margin-right: 20px;
}
</style>
