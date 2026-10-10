<template>
  <component
    :is="as"
    class="text"
    :class="[`text-${size}`, variant, { medium }]"
  >
    <slot />
  </component>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';

type Size = 'large' | 'label' | 'body' | 'caption' | 'overline';
type Variant = 'muted' | 'default' | 'primary';

export default Vue.extend({
  name: 'SText',

  props: {
    size: {
      type: String as PropType<Size>,
      default: 'body',
    },

    variant: {
      type: String as PropType<Variant>,
      default: 'default',
    },

    // Medium weight, for a label that leads its row.
    medium: {
      type: Boolean,
      default: false,
    },

    // Rendered tag — use 'span' for inline/phrasing contexts (e.g. inside
    // a <button>), where the default 'p' isn't valid HTML.
    as: {
      type: String,
      default: 'p',
    },
  },
});
</script>

<style lang="scss" scoped>
.text {
  margin: 0;
  font-weight: 400;
  color: var(--text-primary);
}

.muted {
  color: var(--text-muted);
}

.primary {
  color: var(--accent-text);
}

.text-large {
  font-size: 14px;
  line-height: 1.3;
}

.text-body {
  font-size: 13px;
  line-height: 1.45;
}

.text-label {
  font-size: 13px;
  font-weight: 500;
  line-height: 1.3;
}

.text-caption {
  font-size: 12px;
  line-height: 1.4;
}

.text-overline {
  font-size: 11px;
  font-weight: 600;
  line-height: 1.3;
  letter-spacing: 0.09em;
  text-transform: uppercase;
  color: var(--text-faint);
}

.text.medium {
  font-weight: 500;
}
</style>
