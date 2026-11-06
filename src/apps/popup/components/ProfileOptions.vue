<template>
  <div :class="{ 'profile-options': options.length }">
    <slot />
    <s-style-options
      v-if="options.length"
      :options="options"
      @option="(name, value) => $emit('option', name, value)"
    />
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';
import { SStyleOptions } from '@stylebot/components';
import type { StyleOption } from '@stylebot/types';

/**
 * A profile's row with the options its css declares beneath it, in one
 * block, so they read as the profile's own rather than Stylebot's. Emits
 * `option` with an option's name and its new value.
 */
export default Vue.extend({
  name: 'ProfileOptions',

  components: {
    SStyleOptions,
  },

  props: {
    // The options in effect, when the profile is applied and declares any.
    options: {
      type: Array as PropType<Array<StyleOption>>,
      default: () => [],
    },
  },
});
</script>

<style lang="scss" scoped>
.profile-options {
  margin-bottom: 2px;
  padding-bottom: 2px;
  box-shadow: inset 0 0 0 1px var(--panel-border);
  border-radius: 8px;

  > ::v-deep :first-child {
    border-end-start-radius: 0;
    border-end-end-radius: 0;
  }

  ::v-deep .style-option--select:last-child {
    margin-bottom: 6px;
  }
}
</style>
