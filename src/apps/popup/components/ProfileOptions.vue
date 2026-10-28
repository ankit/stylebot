<template>
  <div :class="{ 'profile-options': scheme }">
    <slot />

    <div v-if="scheme" class="profile-option">
      <s-text as="span" class="profile-option-label">{{ t('mode') }}</s-text>
      <s-color-scheme-switch
        :value="scheme"
        @change="$emit('scheme', $event)"
      />
    </div>
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';
import { SColorSchemeSwitch, SText } from '@stylebot/components';
import type { StyleColorScheme } from '@stylebot/types';

/**
 * A profile's row with the options its css declares beneath it, in one
 * block, so they read as the profile's own rather than Stylebot's.
 */
export default Vue.extend({
  name: 'ProfileOptions',

  components: {
    SColorSchemeSwitch,
    SText,
  },

  props: {
    // The color scheme in effect, when the style's css declares one.
    scheme: {
      type: String as PropType<StyleColorScheme | null>,
      default: null,
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
