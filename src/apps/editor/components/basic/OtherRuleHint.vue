<template>
  <div class="other-rule-hint">
    <s-tooltip
      :text="t(overrides ? 'overridden_by_this_rule' : 'set_by_this_rule')"
      class="other-rule-tooltip"
    >
      <s-chip
        :label="selector"
        :variant="overrides ? 'warning' : 'filled'"
        size="small"
        @click="open"
      >
        <template #icon><arrow-up-right-icon :size="11" /></template>
      </s-chip>
    </s-tooltip>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { SChip, STooltip } from '@stylebot/components';
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
    SChip,
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
</style>
