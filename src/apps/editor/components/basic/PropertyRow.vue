<template>
  <div class="property-row" :class="{ last }">
    <div class="property-row-main">
      <s-text size="label" variant="muted" class="property-row-label">
        {{ label }}
      </s-text>
      <div class="property-row-control"><slot /></div>
    </div>
    <other-rule-hint v-if="otherRule" :selector="otherRule.selector" />
    <other-rule-hint
      v-else-if="overridingRule"
      :selector="overridingRule.selector"
      overrides
    />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { SText } from '@stylebot/components';

import OtherRuleHint from './OtherRuleHint.vue';

export default Vue.extend({
  name: 'PropertyRow',

  components: {
    OtherRuleHint,
    SText,
  },

  props: {
    label: {
      type: String,
      required: true,
    },

    // Drops the bottom divider on the last row in a card.
    last: {
      type: Boolean,
      default: false,
    },

    // The property the control edits, to say when another selector sets it.
    property: {
      type: String,
      default: '',
    },
  },

  computed: {
    overridingRule(): { selector: string; value: string } | null {
      return (
        this.$store.getters.overriddenByOtherSelector[this.property] ?? null
      );
    },

    otherRule(): { selector: string; value: string } | null {
      return this.$store.getters.setByOtherSelector[this.property] ?? null;
    },
  },
});
</script>

<style lang="scss" scoped>
.property-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 6px 0;
  border-bottom: 1px solid
    color-mix(in srgb, var(--text-primary) 7%, transparent);

  &.last {
    padding-bottom: 2px;
    border-bottom: none;
  }
}

.property-row-main {
  display: flex;
  align-items: center;
  gap: 12px;
}

.property-row-label {
  @include truncate;

  flex: 1 0 auto;
  min-width: 0;
}

.property-row-control {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  min-width: 108px;
}
</style>
