<template>
  <span class="preview-summary">
    <span class="summary">
      <span class="thumbnail">
        <s-thumbnail :src="thumbnail" :width="69" :height="43" />
        <slot name="badge" />
      </span>
      <span
        class="details"
        :class="{ confirming }"
        :role="confirming ? 'status' : undefined"
      >
        <s-text
          :as="href ? 'a' : 'span'"
          size="large"
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

    <span class="divider" />
  </span>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';
import { SText, SThumbnail } from '@stylebot/components';
import { getGalleryUrl } from '@stylebot/gallery';
import type { GalleryStyle } from '@stylebot/types';

/**
 * The style's thumbnail with a title and status beside it, then a divider
 * before the bar's buttons. A `badge` slot sits on the thumbnail's corner,
 * and `confirming` announces the text and slides it in.
 */
export default Vue.extend({
  name: 'PreviewSummary',

  components: {
    SText,
    SThumbnail,
  },

  props: {
    styleData: {
      type: Object as PropType<GalleryStyle>,
      required: true,
    },

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
  },

  computed: {
    thumbnail(): string {
      return getGalleryUrl(this.styleData.screenshot);
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
  padding-left: 2px;
}

.thumbnail {
  position: relative;
  display: flex;
  flex: none;
  min-width: 12px;
  min-height: 12px;
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

.divider {
  flex: none;
  align-self: stretch;
  width: 1px;
  margin: 4px;
  background: var(--panel-border);
}

@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateY(5px);
  }
}
</style>
