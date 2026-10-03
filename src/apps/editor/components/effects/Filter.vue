<template>
  <div class="filter">
    <property-row :label="t('filter')">
      <s-segmented-control
        fit
        :value="type === 'none' ? '' : type"
        placeholder="none"
        :options="options"
        :disabled="disabled"
        @change="select"
      />
    </property-row>

    <property-row v-if="type !== 'none'" :label="amountLabel">
      <s-number-field
        :unit="config.unit"
        :value="String(amount)"
        :disabled="disabled"
        @input="setAmountText"
      />
    </property-row>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { t } from '@stylebot/i18n';
import { SNumberField, SSegmentedControl } from '@stylebot/components';
import { getDeclarationValue } from '@stylebot/css';

import PropertyRow from '../basic/PropertyRow.vue';

type FilterType = 'grayscale' | 'invert' | 'blur' | 'none';

type FilterConfig = {
  min: number;
  max: number;
  step: number;
  default: number;
  unit: string;
};

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
    SNumberField,
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
      return getDeclarationValue(this.$store.getters.activeRule, 'filter');
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
      return this.type === 'none'
        ? FILTER_CONFIG.grayscale
        : FILTER_CONFIG[this.type];
    },

    amountLabel(): string {
      const option = this.options.find(({ value }) => value === this.type);
      return t('filter_amount', [option?.label ?? '']);
    },

    disabled(): boolean {
      return !this.$store.state.activeSelector;
    },
  },

  methods: {
    select(type: FilterType): void {
      if (type === 'none' || type === this.type) {
        this.$store.dispatch('applyDeclaration', {
          property: 'filter',
          value: '',
        });
        return;
      }

      const { default: amount, unit } = FILTER_CONFIG[type];
      this.$store.dispatch('applyDeclaration', {
        property: 'filter',
        value: `${type}(${amount}${unit})`,
      });
    },

    setAmountText(text: string): void {
      const parsed = parseFloat(text);
      const { default: fallback, max } = this.config;
      this.setAmount(Number.isNaN(parsed) ? fallback : Math.min(max, parsed));
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
