<template>
  <component :is="as" class="heading" :class="size">
    <slot />
  </component>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue';

type Size = 'lg' | 'md' | 'sm';
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
  color: var(--foreground);
}

.lg {
  font-weight: 600;
  font-size: 17px;
  line-height: 1.2;
  letter-spacing: -0.01em;
}

.md {
  font-weight: 600;
  font-size: 15px;
  line-height: 1.25;
  letter-spacing: -0.01em;
}

.sm {
  font-weight: 600;
  font-size: 13.5px;
  line-height: 1.25;
}
</style>
