<template>
  <component :is="as" class="text" :class="[size, variant]">
    <slot />
  </component>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue';

type Size = 'label' | 'body' | 'caption' | 'small';
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
  color: var(--foreground);
}

.muted {
  color: var(--muted-foreground);
}

.label {
  font-size: 13px;
  line-height: 1.3;
}

.body {
  font-size: 12.5px;
  line-height: 1.45;
}

.caption {
  font-size: 12px;
  line-height: 1.4;
}

.small {
  font-size: 11.5px;
  line-height: 1.3;
}
</style>
