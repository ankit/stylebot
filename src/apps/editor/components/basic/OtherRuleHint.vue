<template>
  <div class="other-rule-hint">
    <s-tooltip
      :text="t(overrides ? 'overridden_by_this_rule' : 'set_by_this_rule')"
      class="other-rule-tooltip"
    >
      <button
        type="button"
        class="other-rule-link"
        :class="{ overrides }"
        @click="open"
      >
        <span class="other-rule-link-text">{{ selector }}</span>
        <arrow-up-right-icon :size="11" class="other-rule-link-icon" />
      </button>
    </s-tooltip>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { STooltip } from '@stylebot/components';
import { ArrowUpRightIcon } from '@stylebot/icons';

/**
 * Sits under a control whose value comes from another of the user's
 * selectors, naming it and switching the editor to it. With `overrides`,
 * that selector wins over a value the active rule sets too.
 */
export default Vue.extend({
  name: 'OtherRuleHint',

  components: {
    ArrowUpRightIcon,
    STooltip,
  },

  props: {
    selector: {
      type: String,
      required: true,
    },

    overrides: {
      type: Boolean,
      default: false,
    },
  },

  methods: {
    open(): void {
      this.$store.commit('setActiveSelector', this.selector);
    },
  },
});
</script>

<style lang="scss" scoped>
.other-rule-hint {
  display: flex;
  justify-content: flex-end;
  min-width: 0;
}

.other-rule-tooltip {
  min-width: 0;
  max-width: 100%;
}

.other-rule-link {
  @include button-reset;

  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
  max-width: 100%;
  padding: 3px 6px;
  border-radius: 5px;
  background: var(--hover-tint);
  font-family: var(--font-mono);
  font-size: 11px;
  line-height: 1.2;
  color: var(--text-secondary);
  cursor: pointer;

  &:hover {
    color: var(--text-primary);
  }

  &.overrides {
    background: var(--warning-background);
    box-shadow: inset 0 0 0 1px var(--warning-border);
    color: var(--warning);
  }

  @include focus-ring;
}

.other-rule-link-text {
  @include truncate;

  min-width: 0;
  font-family: var(--font-mono);
}

.other-rule-link-icon {
  flex: none;
  color: var(--accent-text);

  .overrides & {
    color: inherit;
  }
}
</style>
