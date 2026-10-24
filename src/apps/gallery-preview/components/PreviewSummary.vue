<template>
  <span class="preview-summary">
    <span class="summary" :class="{ dimmed }">
      <slot name="icon" />
      <span
        class="details"
        :class="{ confirming }"
        :role="confirming ? 'status' : undefined"
      >
        <s-text
          :as="href ? 'a' : 'span'"
          size="large"
          medium
          class="name"
          :href="href || undefined"
          :title="title"
          :target="href ? '_blank' : undefined"
          :rel="href ? 'noopener noreferrer' : undefined"
        >
          {{ title }}
        </s-text>
        <s-text as="span" variant="muted" class="status">
          {{ status }}
        </s-text>
      </span>
    </span>
  </span>
</template>

<script lang="ts">
import Vue from 'vue';
import { SText } from '@stylebot/components';

/**
 * The style's title with its status below, after an optional `icon`.
 */
export default Vue.extend({
  name: 'PreviewSummary',

  components: {
    SText,
  },

  props: {
    title: {
      type: String,
      required: true,
    },

    status: {
      type: String,
      required: true,
    },

    href: {
      type: String,
      default: '',
    },

    confirming: {
      type: Boolean,
      default: false,
    },

    dimmed: {
      type: Boolean,
      default: false,
    },
  },
});
</script>

<style lang="scss" scoped>
.preview-summary {
  display: contents;
}

.summary {
  display: flex;
  flex: 1;
  align-items: center;
  gap: 12px;
  min-width: 0;
  padding: 0 16px 0 6px;
}

.details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  max-width: 300px;
}

.details.confirming {
  animation: slide-in 300ms 120ms ease-out backwards;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
}

.name {
  @include truncate;

  align-self: flex-start;
  max-width: 100%;
  text-decoration: none;

  @include focus-ring;
}

.status {
  @include truncate;
}

.dimmed .name {
  color: var(--text-muted);
}

@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateY(5px);
  }
}
</style>
