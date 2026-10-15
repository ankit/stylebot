<template>
  <div class="callout" :class="tone" :role="tone === 'danger' ? 'alert' : null">
    <div class="message">
      <slot />
    </div>

    <s-icon-button
      v-if="$listeners.dismiss"
      class="dismiss"
      :aria-label="t('dismiss')"
      @click="$emit('dismiss')"
    >
      <x-icon :size="16" />
    </s-icon-button>
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';
import { XIcon } from '@stylebot/icons';

import SIconButton from './SIconButton.vue';

type Tone = 'info' | 'warning' | 'danger';

/**
 * A tinted box for a message that sits in the flow of a page, such as an
 * error. Listening to `dismiss` adds a close button.
 */
export default Vue.extend({
  name: 'SCallout',

  components: {
    SIconButton,
    XIcon,
  },

  props: {
    tone: {
      type: String as PropType<Tone>,
      default: 'info',
    },
  },
});
</script>

<style lang="scss" scoped>
.callout {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 14px;
  border: 1px solid transparent;
  border-radius: 9px;
  font-size: 13px;
  line-height: 1.45;
}

.message {
  flex: 1;
  min-width: 0;
}

.dismiss {
  margin: -1px -6px -1px 0;
}

.info {
  border-color: var(--info-border);
  color: var(--text-primary);
  background: var(--info);
}

.warning {
  border-color: var(--warning-border);
  color: var(--text-body);
  background: var(--warning-background);
}

.danger {
  border-color: var(--danger-border);
  color: var(--danger);
  background: var(--danger-background);
}
</style>
