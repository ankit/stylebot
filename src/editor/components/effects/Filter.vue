<template>
  <property-row :label="t('filter')" last>
    <div class="filter-control">
      <div class="value-group" role="group">
        <button
          v-for="option in options"
          :key="option.type"
          type="button"
          class="value-option"
          :class="{ active: type === option.type }"
          :disabled="disabled"
          @click="select(option.type)"
        >
          {{ option.title }}
        </button>
      </div>

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
import { SSlider } from '@stylebot/components';

import PropertyRow from '../basic/PropertyRow.vue';

type FilterType = 'grayscale' | 'invert' | 'blur' | 'none';

type FilterConfig = { min: number; max: number; step: number; default: number; unit: string };

const FILTER_CONFIG: Record<Exclude<FilterType, 'none'>, FilterConfig> = {
  grayscale: { min: 0, max: 100, step: 1, default: 100, unit: '%' },
  invert: { min: 0, max: 100, step: 1, default: 100, unit: '%' },
  blur: { min: 0, max: 20, step: 1, default: 4, unit: 'px' },
};

const FILTER_VALUE_REGEX = /^(grayscale|invert|blur)\(([\d.]+)(%|px)?\)$/;

export default Vue.extend({
  name: 'FilterControl',

  components: {
    PropertyRow,
    SSlider,
  },

  data(): { options: Array<{ title: string; type: FilterType }> } {
    return {
      options: [
        { title: t('filter_gray'), type: 'grayscale' },
        { title: t('filter_invert'), type: 'invert' },
        { title: t('filter_blur'), type: 'blur' },
        { title: t('none'), type: 'none' },
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

.property-row.last {
  align-items: flex-start;
}

.filter-control {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

.value-group {
  display: flex;
  gap: 1px;
  padding: 1px;
  border-radius: 7px;
  background: var(--tab-surface);
}

.value-option {
  @include button-reset;

  display: inline-flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  min-width: 27px;
  padding: 5px 6px;
  border-radius: 6px;
  font-size: 12px;
  line-height: 1.2;
  color: var(--text-muted);
  outline: none;
  cursor: pointer;

  &:hover:not(:disabled):not(.active) {
    color: var(--text-primary);
  }

  &.active {
    font-weight: 600;
    color: var(--text-primary);
    background: var(--card-surface);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  }

  &:disabled {
    cursor: default;
    opacity: 0.6;
  }

  &:focus-visible {
    color: var(--text-primary);
  }

  @include focus-ring;
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
