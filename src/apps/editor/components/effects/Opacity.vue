<template>
  <property-row :label="t('opacity')">
    <div class="opacity-control">
      <s-slider
        class="opacity-slider"
        :value="value"
        :min="0"
        :max="1"
        :step="0.05"
        :disabled="disabled"
        @input="apply"
      />

      <s-number-field
        unit="%"
        placeholder="100"
        :value="percent"
        :disabled="disabled"
        @input="applyPercent"
      />
    </div>
  </property-row>
</template>

<script lang="ts">
import Vue from 'vue';
import { SNumberField, SSlider } from '@stylebot/components';
import { getDeclarationValue } from '@stylebot/css';

import PropertyRow from '../basic/PropertyRow.vue';

export default Vue.extend({
  name: 'Opacity',

  components: {
    PropertyRow,
    SNumberField,
    SSlider,
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

    // Empty while opacity is unset, so clearing the field reads as "none".
    percent(): string {
      const declared = getDeclarationValue(
        this.$store.getters.activeRule,
        'opacity'
      );
      return declared ? String(Math.round(this.value * 100)) : '';
    },

    disabled(): boolean {
      return !this.$store.state.activeSelector;
    },
  },

  methods: {
    applyPercent(percent: string): void {
      const parsed = parseFloat(percent);
      this.apply(Number.isNaN(parsed) ? 1 : Math.min(100, parsed) / 100);
    },

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
.opacity-control {
  display: flex;
  align-items: center;
  gap: 10px;
}

.opacity-slider {
  flex: none;
  width: 100px;
}
</style>
