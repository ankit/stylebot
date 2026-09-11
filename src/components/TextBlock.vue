<template>
  <p class="text" :class="[size, { muted }]">
    <slot />
  </p>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue';

type Size = 'body' | 'caption';

export default Vue.extend({
  // Named TextBlock, not Text — Vue 2 treats <text> as a reserved SVG tag,
  // so a component registered/used as <text> silently renders as inert SVG.
  name: 'TextBlock',

  props: {
    size: {
      type: String as PropType<Size>,
      default: 'body',
    },

    // Almost every current usage is secondary/muted copy; opt out for the
    // rare full-emphasis case (e.g. a notification's main sentence).
    muted: {
      type: Boolean,
      default: true,
    },
  },
});
</script>

<style lang="scss" scoped>
.text {
  margin: 0;
  font-weight: 400;
  color: var(--main-foreground);
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
