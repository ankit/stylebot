<template>
  <p class="text" :class="[size, variant]">
    <slot />
  </p>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue';

type Size = 'body' | 'caption';
type Variant = 'muted' | 'default';

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
  },
});
</script>

<style lang="scss" scoped>
.text {
  margin: 0;
  font-weight: 400;
  color: var(--foreground);
}

.muted {
  color: var(--muted-foreground);
}

.body {
  font-size: 12.5px;
  line-height: 1.45;
}

.caption {
  font-size: 12px;
  line-height: 1.4;
}
</style>
