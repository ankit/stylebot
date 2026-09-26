<template>
  <span class="selector-chips">
    <s-chip v-for="(part, i) in shown" :key="i" :title="part">
      {{ part }}
    </s-chip>
    <s-chip v-if="hidden.length" class="more" :title="hidden.join('\n')">
      {{ t('count_more', [String(hidden.length)]) }}
    </s-chip>
  </span>
</template>

<script lang="ts">
import Vue from 'vue';
import type { PropType } from 'vue';
import { SChip } from '@stylebot/components';

const MAX_CHIPS = 3;

export default Vue.extend({
  name: 'SelectorChips',

  components: {
    SChip,
  },

  props: {
    parts: {
      type: Array as PropType<Array<string>>,
      required: true,
    },
  },

  computed: {
    /**
     * The "+N more" chip takes the last slot, so it never stands in for one.
     */
    shown(): Array<string> {
      return this.parts.length > MAX_CHIPS
        ? this.parts.slice(0, MAX_CHIPS - 1)
        : this.parts;
    },

    hidden(): Array<string> {
      return this.parts.slice(this.shown.length);
    },
  },
});
</script>

<style lang="scss" scoped>
.selector-chips {
  display: contents;
}

.more {
  flex: none;
  font-family: inherit;
  color: var(--text-secondary);
}
</style>
