<template>
  <label class="field">
    <s-text as="span" size="label" variant="muted">
      {{ label }}
      <span v-if="optional" class="optional">· {{ t('optional') }}</span>
    </s-text>
    <s-tooltip v-if="tooltip" :text="tooltip" grow>
      <slot />
    </s-tooltip>
    <slot v-else />
    <s-text v-if="hint" as="span" variant="muted">{{ hint }}</s-text>
  </label>
</template>

<script lang="ts">
import Vue from 'vue';
import { SText, STooltip } from '@stylebot/components';

/**
 * A labelled field in the publish form, wrapping its input, with an
 * optional marker and a hint below or as a tooltip.
 */
export default Vue.extend({
  name: 'GalleryField',

  components: {
    SText,
    STooltip,
  },

  props: {
    label: {
      type: String,
      required: true,
    },

    optional: {
      type: Boolean,
      default: false,
    },

    hint: {
      type: String,
      default: '',
    },

    // The hint as a tooltip on the input instead, to save a line.
    tooltip: {
      type: String,
      default: '',
    },
  },
});
</script>

<style lang="scss" scoped>
.field {
  display: flex;
  flex-direction: column;
  gap: 7px;
  min-width: 0;
}

.optional {
  opacity: 0.75;
}
</style>
