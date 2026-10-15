<template>
  <span
    class="status-dot"
    :class="tone"
    :style="{ width: `${size}px`, height: `${size}px` }"
    aria-hidden="true"
  />
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';

type Tone = 'success' | 'warning' | 'danger' | 'accent' | 'neutral';

/**
 * A small coloured dot that marks a state beside its text, such as synced,
 * published or unsaved.
 */
export default Vue.extend({
  name: 'SStatusDot',

  props: {
    tone: {
      type: String as PropType<Tone>,
      default: 'neutral',
    },

    size: {
      type: Number,
      default: 6,
    },
  },
});
</script>

<style lang="scss" scoped>
.status-dot {
  flex: none;
  display: inline-block;
  border-radius: 50%;
}

.success {
  background: var(--success);
}

.warning {
  background: var(--warning-icon);
}

.danger {
  background: var(--danger);
}

.accent {
  background: var(--accent);
}

.neutral {
  background: var(--text-muted);
  opacity: 0.5;
}
</style>
