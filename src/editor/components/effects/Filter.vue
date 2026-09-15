<template>
  <property-row :label="t('filter')" last>
    <div class="filter-control">
      <s-segmented-control fit :value="type" :options="options" :disabled="disabled" @change="select" />

      <div v-if="type !== 'none'" class="filter-amount-row">
        <s-slider
          :value="amount"
          :min="config.min"
          :max="config.max"
          :step="config.step"
          :disabled="disabled"
          @input="setAmount"
        />

        <span class="filter-amount-value">{{ amount }}{{ config.unit }}</span>
      </div>
    </div>
  </property-row>
</template>

<script lang="ts">
import Vue from 'vue';
import { Declaration } from 'postcss';
import { t } from '@stylebot/i18n';
import { SSlider, SSegmentedControl } from '@stylebot/components';

import PropertyRow from '../basic/PropertyRow.vue';

type FilterType = 'grayscale' | 'invert' | 'blur' | 'none';

type FilterConfig = { min: number; max: number; step: number; default: number; unit: string };

const FILTER_CONFIG: Record<Exclude<FilterType, 'none'>, FilterConfig> = {
  grayscale: { min: 0, max: 100, step: 1, default: 50, unit: '%' },
  invert: { min: 0, max: 100, step: 1, default: 50, unit: '%' },
  blur: { min: 0, max: 20, step: 1, default: 4, unit: 'px' },
};

const FILTER_VALUE_REGEX = /^(grayscale|invert|blur)\(([\d.]+)(%|px)?\)$/;

export default Vue.extend({
  name: 'FilterControl',

  components: {
    PropertyRow,
    SSlider,
    SSegmentedControl,
  },

  data(): { options: Array<{ label: string; value: FilterType }> } {
    return {
      options: [
        { label: t('filter_gray'), value: 'grayscale' },
        { label: t('filter_invert'), value: 'invert' },
        { label: t('filter_blur'), value: 'blur' },
        { label: t('none'), value: 'none' },
      ],
    };
  },

  computed: {
    rawValue(): string {
      const activeRule = this.$store.getters.activeRule;
      let value = '';

      if (activeRule) {
        activeRule.clone().walkDecls('filter', (decl: Declaration) => {
          value = decl.value;
        });
      }

      return value;
    },

    type(): FilterType {
      const match = this.rawValue.match(FILTER_VALUE_REGEX);
      return match ? (match[1] as FilterType) : 'none';
    },

    amount(): number {
      const match = this.rawValue.match(FILTER_VALUE_REGEX);
      return match ? parseFloat(match[2]) : 0;
    },

    config(): FilterConfig {
      return this.type === 'none' ? FILTER_CONFIG.grayscale : FILTER_CONFIG[this.type];
    },

    disabled(): boolean {
      return !this.$store.state.activeSelector;
    },
  },

  methods: {
    select(type: FilterType): void {
      if (type === 'none' || type === this.type) {
        this.$store.dispatch('applyDeclaration', { property: 'filter', value: '' });
        return;
      }

      const { default: amount, unit } = FILTER_CONFIG[type];
      this.$store.dispatch('applyDeclaration', {
        property: 'filter',
        value: `${type}(${amount}${unit})`,
      });
    },

    setAmount(amount: number): void {
      if (this.type === 'none') {
        return;
      }

      this.$store.dispatch('applyDeclaration', {
        property: 'filter',
        value: `${this.type}(${amount}${this.config.unit})`,
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

.filter-control {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.filter-amount-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-amount-value {
  flex: none;
  width: 32px;
  font-family: var(--font-mono);
  font-size: 12.5px;
  color: var(--text-primary);
}
</style>
