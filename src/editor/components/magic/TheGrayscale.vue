<template>
  <feature-card :label="t('grayscale')">
    <template #toggle>
      <toggle-switch size="lg" :value="active" @change="toggleActive" />
    </template>

    <s-text variant="muted">{{ t('grayscale_description') }}</s-text>

    <div v-if="active" class="grayscale-slider-row">
      <input
        :value="percent"
        type="range"
        class="grayscale-range"
        min="1"
        max="100"
        step="1"
        @input="setPercent($event.target.valueAsNumber)"
      />

      <span class="grayscale-value">{{ percent }} %</span>
    </div>
  </feature-card>
</template>

<script lang="ts">
import Vue from 'vue';
import { ToggleSwitch, SText } from '@stylebot/components';

import FeatureCard from './FeatureCard.vue';

export default Vue.extend({
  name: 'TheGrayscale',

  components: {
    FeatureCard,
    ToggleSwitch,
    SText,
  },

  data(): { lastPercent: number } {
    return {
      lastPercent: 100,
    };
  },

  computed: {
    percent(): number {
      return this.$store.getters.grayscale;
    },

    active(): boolean {
      return this.percent > 0;
    },
  },

  methods: {
    toggleActive(checked: boolean): void {
      if (checked) {
        this.apply(this.lastPercent || 100);
      } else {
        this.lastPercent = this.percent;
        this.apply(0);
      }
    },

    setPercent(percent: number): void {
      this.apply(percent);
    },

    apply(percent: number): void {
      this.$store.dispatch('applyFilter', {
        effectName: 'grayscale',
        percent,
      });
    },
  },
});
</script>

<style lang="scss" scoped>
.grayscale-slider-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
}

.grayscale-value {
  flex: none;
  font-family: var(--font-mono);
  font-size: 12.5px;
  color: var(--foreground);
}

.grayscale-range {
  flex: 1;
  min-width: 0;
  height: 16px;
  margin: 0;
  appearance: none;
  -webkit-appearance: none;
  background: transparent;

  &::-webkit-slider-runnable-track {
    height: 4px;
    border-radius: 2px;
    background: var(--accent);
  }

  &::-webkit-slider-thumb {
    appearance: none;
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    margin-top: -6px;
    border-radius: 50%;
    background: var(--primary);
    cursor: pointer;
  }

  &::-moz-range-track {
    height: 4px;
    border-radius: 2px;
    background: var(--accent);
  }

  &::-moz-range-thumb {
    width: 16px;
    height: 16px;
    border: none;
    border-radius: 50%;
    background: var(--primary);
    cursor: pointer;
  }

  &:focus-visible::-webkit-slider-thumb {
    outline: 2px solid var(--ring);
    outline-offset: 1px;
  }
}
</style>
