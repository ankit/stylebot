<template>
  <span class="inline-list" :class="{ mono }">
    <template v-for="(part, i) in parts">
      <span
        v-if="i > 0"
        :key="`separator-${i}`"
        class="separator"
        v-text="', '"
      />
      <span :key="i" class="part">{{ part }}</span>
    </template>
  </span>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';

export default Vue.extend({
  name: 'SInlineList',

  props: {
    parts: {
      type: Array as PropType<Array<string>>,
      required: true,
    },

    mono: {
      type: Boolean,
      default: false,
    },
  },
});
</script>

<style lang="scss" scoped>
.inline-list {
  min-width: 0;
  color: var(--field-ink);
  word-break: break-word;

  &.mono {
    font-family: var(--font-mono);
  }
}

.part,
.separator {
  font-family: inherit;
}

.separator {
  color: var(--field-placeholder);
}
</style>
