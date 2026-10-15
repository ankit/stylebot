<template>
  <div class="footer">
    <s-status-dot v-if="dot" :tone="dot" :size="8" />
    <s-text as="span" size="large" variant="muted" class="status">
      <a
        v-if="target && !publishing"
        class="status-link"
        :href="galleryUrl"
        target="_blank"
        rel="noopener"
        :title="t('view_in_gallery')"
      >
        {{ status }}
      </a>
      <template v-else>{{ status }}</template>
    </s-text>

    <s-button
      variant="primary"
      class="publish-button"
      :disabled="!canPublish"
      :title="target && !hasChanges ? t('no_changes_to_publish') : ''"
      @click="$emit('publish')"
    >
      <s-spinner v-if="publishing" />
      {{ label }}
    </s-button>
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';
import { SButton, SSpinner, SStatusDot, SText } from '@stylebot/components';
import { getGalleryStyleUrl } from '@stylebot/gallery';
import type { GalleryStyle } from '@stylebot/types';

/**
 * The publish form's footer: where the style stands in the Gallery, linking
 * to it once published, and the button that emits `publish`.
 */
export default Vue.extend({
  name: 'PublishFooter',

  components: {
    SButton,
    SSpinner,
    SStatusDot,
    SText,
  },

  props: {
    // The Gallery style this publishes a new version of, if any.
    target: {
      type: Object as PropType<GalleryStyle | null>,
      default: null,
    },

    publishing: {
      type: Boolean,
      default: false,
    },

    canPublish: {
      type: Boolean,
      default: false,
    },

    hasChanges: {
      type: Boolean,
      default: false,
    },
  },

  computed: {
    dot(): 'neutral' | 'warning' | 'success' | null {
      if (this.publishing) {
        return 'neutral';
      }

      if (!this.target) {
        return null;
      }

      return this.target.status === 'hidden' ? 'warning' : 'success';
    },

    status(): string {
      if (this.publishing) {
        return this.t('uploading');
      }

      if (!this.target) {
        return this.t('not_published_yet');
      }

      const version = String(this.target.version);

      if (this.target.status === 'hidden') {
        return this.t('version_number_is_hidden', [version]);
      }

      return this.t('version_number_is_live', [version]);
    },

    label(): string {
      if (this.publishing) {
        return this.t('publishing');
      }

      return this.target ? this.t('publish_update') : this.t('publish');
    },

    galleryUrl(): string {
      return this.target ? getGalleryStyleUrl(this.target) : '';
    },
  },
});
</script>

<style lang="scss" scoped>
.footer {
  flex: none;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 12px 12px 16px;
  border-top: 1px solid var(--panel-border);
}

.footer .publish-button {
  padding: 10px 16px;
  font-size: 14px;
}

.status {
  @include truncate;

  flex: 1;
  min-width: 0;
}

.status-link {
  color: inherit;
  text-decoration: none;

  &:hover {
    color: var(--text-primary);
    text-decoration: underline;
  }

  @include focus-ring(2px);
}
</style>
