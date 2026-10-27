<template>
  <div :class="{ 'profile-options': scheme }">
    <slot />

    <div v-if="scheme" class="profile-option">
      <s-text as="span" class="profile-option-label">{{ t('mode') }}</s-text>
      <s-segmented-control
        fit
        :value="scheme"
        :options="schemeOptions"
        :aria-label="t('mode')"
        @change="$emit('scheme', $event)"
      >
        <template #option="{ option }">
          <component :is="option.icon" :size="14" />
        </template>
      </s-segmented-control>
    </div>
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';
import { SSegmentedControl, SText } from '@stylebot/components';
import { MonitorIcon, MoonIcon, SunIcon } from '@stylebot/icons';
import type { StyleColorScheme } from '@stylebot/types';

/**
 * A profile's row with the options its css declares beneath it, in one
 * block, so they read as the profile's own rather than Stylebot's.
 */
export default Vue.extend({
  name: 'ProfileOptions',

  components: {
    SSegmentedControl,
    SText,
    MonitorIcon,
    MoonIcon,
    SunIcon,
  },

  props: {
    // The color scheme in effect, when the style's css declares one.
    scheme: {
      type: String as PropType<StyleColorScheme | null>,
      default: null,
    },
  },

  computed: {
    schemeOptions(): Array<{
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

<style lang="scss" scoped>
.profile-options {
  box-shadow: inset 0 0 0 1px var(--panel-border);
  border-radius: 8px;
}

.profile-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 2px 5px 6px 10px;
}

.profile-option-label {
  @include truncate;

  min-width: 0;
  color: var(--text-secondary);
}
</style>
