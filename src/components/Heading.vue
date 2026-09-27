<template>
  <component :is="as" class="heading" :class="size">
    <slot />
  </component>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';

type Size = 'xl' | 'lg' | 'md' | 'sm';
type As = 'h1' | 'h2' | 'h3' | 'div';

export default Vue.extend({
  name: 'Heading',

  props: {
    size: {
      type: String as PropType<Size>,
      default: 'lg',
    },

    // No default — forces each call site to pick the semantically correct
    // element rather than silently rendering a non-heading div.
    as: {
      type: String as PropType<As>,
      required: true,
    },
  },
});
</script>

<style lang="scss" scoped>
.heading {
  margin: 0;
  color: var(--text-primary);
}

.xl {
  font-weight: 600;
  font-size: 20px;
  line-height: 28px;
  letter-spacing: -0.01em;
}

.lg {
  font-weight: 600;
  font-size: 16px;
  line-height: 24px;
  letter-spacing: -0.01em;
}

.md {
  font-weight: 600;
  font-size: 14px;
  line-height: 1.25;
  letter-spacing: -0.01em;
}

.sm {
  font-weight: 600;
  font-size: 13px;
  line-height: 1.25;
}
</style>
