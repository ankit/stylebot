<template>
  <span class="shortcut-kbd" :class="{ small }">
    <template v-for="(part, index) in formatted.parts">
      <kbd :key="index">{{ part }}</kbd
      ><span v-if="index < formatted.parts.length - 1" :key="`joiner-${index}`" class="joiner">{{
        formatted.joiner
      }}</span>
    </template>
  </span>
</template>

<script lang="ts">
import Vue from 'vue';

import { formatShortcut, FormattedShortcut } from './utils/format-shortcut';

export default Vue.extend({
  name: 'ShortcutKbd',

  props: {
    value: {
      type: String,
      required: true,
    },

    small: {
      type: Boolean,
      default: false,
    },
  },

  computed: {
    formatted(): FormattedShortcut {
      return formatShortcut(this.value);
    },
  },
});
</script>

<style lang="scss" scoped>
.shortcut-kbd {
  display: inline-flex;
  align-items: center;
}

kbd {
  font: 400 13px/1 -apple-system, BlinkMacSystemFont, system-ui, 'Segoe UI', sans-serif;
  letter-spacing: 0.3px;
}

.small kbd {
  font-size: 11px;
  letter-spacing: -0.2px;
}

.joiner {
  font-size: 11px;
  margin: 0 1px;
  color: var(--muted-foreground);
}
</style>
