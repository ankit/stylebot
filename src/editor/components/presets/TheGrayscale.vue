<template>
  <feature-card :label="t('grayscale')">
    <template #toggle>
      <toggle-switch size="lg" :value="active" @change="toggleActive" />
    </template>

    <s-text variant="muted">{{ t('grayscale_description') }}</s-text>

    <div v-if="active" class="grayscale-slider-row">
      <s-slider :value="percent" :min="1" :max="100" :step="1" @input="setPercent" />

      <s-text size="body" class="grayscale-value">{{ percent }} %</s-text>
    </div>
  </feature-card>
</template>

<script lang="ts">
import Vue from 'vue';
import { ToggleSwitch, SText, SSlider } from '@stylebot/components';

import FeatureCard from './FeatureCard.vue';

export default Vue.extend({
  name: 'TheGrayscale',

  components: {
    FeatureCard,
    ToggleSwitch,
    SText,
    SSlider,
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
}
</style>
