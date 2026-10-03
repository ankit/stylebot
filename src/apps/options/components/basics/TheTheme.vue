<template>
  <div class="card">
    <div class="text">
      <s-heading as="h2" size="md">{{ t('theme') }}</s-heading>
      <s-text variant="muted" class="description">
        {{ t('theme_description') }}
      </s-text>
    </div>

    <s-segmented-control
      fit
      class="control"
      :value="appearance"
      :options="appearanceOptions"
      @change="appearance = $event"
    >
      <template #option="{ option }">
        <span class="option">
          <component :is="option.icon" :size="14" />
          {{ option.label }}
        </span>
      </template>
    </s-segmented-control>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import { SHeading, SSegmentedControl, SText } from '@stylebot/components';
import { MonitorIcon, MoonIcon, SunIcon } from '@stylebot/icons';
import type { StylebotAppearance } from '@stylebot/types';

export default Vue.extend({
  name: 'TheTheme',

  components: {
    SHeading,
    SSegmentedControl,
    SText,
    MonitorIcon,
    MoonIcon,
    SunIcon,
  },

  computed: {
    appearance: {
      get(): StylebotAppearance {
        return this.$store.state.options.appearance ?? 'system';
      },

      set(value: StylebotAppearance): void {
        this.$store.dispatch('setOption', { name: 'appearance', value });
      },
    },

    appearanceOptions(): Array<{
      value: StylebotAppearance;
      icon: string;
      label: string;
    }> {
      return [
        {
          value: 'system',
          icon: 'monitor-icon',
          label: this.t('appearance_system'),
        },
        {
          value: 'light',
          icon: 'sun-icon',
          label: this.t('appearance_light'),
        },
        {
          value: 'dark',
          icon: 'moon-icon',
          label: this.t('appearance_dark'),
        },
      ];
    },
  },
});
</script>

<style lang="scss" scoped>
.card {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-top: 16px;
  padding: 12px 14px;
  border: 1px solid var(--panel-border);
  border-radius: 10px;
}

.text {
  flex: 1;
  min-width: 0;
}

.description {
  margin-top: 2px;
}

.control {
  flex: none;
}

.option {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
</style>
