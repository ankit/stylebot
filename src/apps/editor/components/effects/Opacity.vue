<template>
  <property-row :label="t('opacity')">
    <s-slider
      class="opacity-slider"
      :value="value"
      :min="0"
      :max="1"
      :step="0.05"
      :disabled="disabled"
      @input="apply"
    />
  </property-row>
</template>

<script lang="ts">
import Vue from 'vue';
import { SSlider } from '@stylebot/components';
import { getDeclarationValue } from '@stylebot/css';

import PropertyRow from '../basic/PropertyRow.vue';

export default Vue.extend({
  name: 'Opacity',

  components: {
    PropertyRow,
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
.opacity-slider {
  flex: 1;
  min-width: 60px;
}
</style>
