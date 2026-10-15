<template>
  <label class="field">
    <s-text as="span" size="label" variant="muted">
      {{ label }}
      <span v-if="optional" class="optional">· {{ t('optional') }}</span>
    </s-text>
    <slot />
    <s-text v-if="hint" as="span" variant="muted">{{ hint }}</s-text>
  </label>
</template>

<script lang="ts">
import Vue from 'vue';
import { SText } from '@stylebot/components';

/**
 * A labelled field in the publish form, wrapping its input, with an
 * optional marker and a hint below.
 */
export default Vue.extend({
  name: 'GalleryField',

  components: {
    SText,
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
