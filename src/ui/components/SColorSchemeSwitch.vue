<template>
  <s-segmented-control
    fit
    :value="value"
    :options="options"
    :aria-label="t('mode')"
    @change="$emit('change', $event)"
  >
    <template #option="{ option }">
      <component :is="option.icon" :size="14" />
    </template>
  </s-segmented-control>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';
import { MonitorIcon, MoonIcon, SunIcon } from '@stylebot/icons';
import type { StyleColorScheme } from '@stylebot/types';

import SSegmentedControl from './SSegmentedControl.vue';

/**
 * The System, Light and Dark switch for a style that declares a color
 * scheme, as icons named by their tooltips. Emits `change`.
 */
export default Vue.extend({
  name: 'SColorSchemeSwitch',

  components: {
    SSegmentedControl,
    MonitorIcon,
    MoonIcon,
    SunIcon,
  },

  model: {
    prop: 'value',
    event: 'change',
  },

  props: {
    value: {
      type: String as PropType<StyleColorScheme>,
      required: true,
    },
  },

  computed: {
    options(): Array<{
      value: StyleColorScheme;
      title: string;
      icon: string;
    }> {
      return [
        {
          value: 'system',
          title: this.t('appearance_system'),
          icon: 'monitor-icon',
        },
        {
          value: 'light',
          title: this.t('appearance_light'),
          icon: 'sun-icon',
        },
        { value: 'dark', title: this.t('appearance_dark'), icon: 'moon-icon' },
      ];
    },
  },
});
</script>
