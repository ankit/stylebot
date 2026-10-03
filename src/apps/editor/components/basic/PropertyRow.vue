<template>
  <div class="property-row">
    <div class="property-row-main">
      <div class="property-row-heading">
        <s-text size="label" variant="muted" class="property-row-label">
          {{ label }}
        </s-text>
        <other-rule-hint v-if="otherRule" :selector="otherRule.selector" />
        <other-rule-hint
          v-else-if="overridingRule"
          :selector="overridingRule.selector"
          overrides
        />
      </div>
      <div class="property-row-control"><slot /></div>
    </div>
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
  padding: 4px 0;
}

.property-row-main {
  display: flex;
  align-items: center;
  min-height: 28px;
  gap: 12px;
}

.property-row-heading {
  flex: 0 1 auto;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 4px;
}

.property-row-label {
  @include truncate;

  flex: none;
  min-width: 0;
  font-size: 13px;
  font-weight: 400;
  color: var(--text-body);
}

.property-row-control {
  flex: none;
  margin-left: auto;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  min-width: 108px;
}
</style>
