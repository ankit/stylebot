<template>
  <property-row :label="t('opacity')">
    <div class="opacity-control">
      <s-slider
        :value="value"
        :min="0"
        :max="1"
        :step="0.05"
        :disabled="disabled"
        @input="apply"
      />

      <s-text as="span" class="opacity-value">{{ value }}</s-text>
    </div>
  </property-row>
</template>

<script lang="ts">
import Vue from 'vue';
import { SSlider, SText } from '@stylebot/components';
import { getDeclarationValue } from '@stylebot/css';

import PropertyRow from '../basic/PropertyRow.vue';

export default Vue.extend({
  name: 'Opacity',

  components: {
    PropertyRow,
    SSlider,
    SText,
  },

  computed: {
    value(): number {
      const value = getDeclarationValue(
        this.$store.getters.activeRule,
        'opacity'
      );
      const parsed = parseFloat(value);
      return Number.isNaN(parsed) ? 1 : parsed;
    },

    disabled(): boolean {
      return !this.$store.state.activeSelector;
    },
  },

  methods: {
    apply(value: number): void {
      const rounded = Math.round(value * 100) / 100;

      this.$store.dispatch('applyDeclaration', {
        property: 'opacity',
        value: rounded === 1 ? '' : String(rounded),
      });
    },
  },
});
</script>

<style lang="scss" scoped>
.property-row ::v-deep .property-row-label {
  flex: 0 0 auto;
}

.property-row ::v-deep .property-row-control {
  flex: 1;
  min-width: 0;
}

.property-row {
  border-bottom: none;
}

.opacity-control {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.opacity-value {
  flex: none;
  width: 24px;
  font-family: var(--font-mono);
}
</style>
