<template>
  <s-list-item padded>
    <template #title>
      <h2 class="heading">{{ t('theme') }}</h2>
    </template>
    <template #meta>
      <s-text variant="muted" as="span">{{ t('theme_description') }}</s-text>
    </template>

    <template #trailing>
      <s-segmented-control
        fit
        size="large"
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
    </template>
  </s-list-item>
</template>

<script lang="ts">
import Vue from 'vue';

import { SListItem, SSegmentedControl, SText } from '@stylebot/components';
import { MonitorIcon, MoonIcon, SunIcon } from '@stylebot/icons';
import type { StylebotAppearance } from '@stylebot/types';

export default Vue.extend({
  name: 'TheTheme',

  components: {
    SListItem,
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
.heading {
  margin: 0;
  font: inherit;
}

.option {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}
</style>
