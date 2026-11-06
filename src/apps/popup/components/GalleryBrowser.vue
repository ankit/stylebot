<template>
  <div>
    <div class="header">
      <button
        type="button"
        class="back"
        :aria-label="t('back')"
        :disabled="loading"
        @click="$emit('back')"
      >
        <chevron-left-icon class="back-icon" :size="16" />
        <s-heading as="span" size="md" class="title">
          {{ t('styles_in_gallery') }}
        </s-heading>
      </button>
    </div>

    <div class="popup-divider" />

    <section class="styles">
      <gallery-suggestion
        v-for="style in styles"
        :key="style.id"
        :style-data="style"
        :previewing="style.id === previewId"
        @preview="$emit('preview', style)"
      />

      <s-callout v-if="error" tone="danger">{{ error }}</s-callout>
    </section>

    <div class="popup-divider" />

    <section class="more">
      <gallery-link :href="browseUrl">{{ t('open_gallery') }}</gallery-link>
    </section>
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';
import { SCallout, SHeading } from '@stylebot/components';
import { ChevronLeftIcon } from '@stylebot/icons';
import type { GalleryStyle } from '@stylebot/types';

import GalleryLink from './GalleryLink.vue';
import GallerySuggestion from './GallerySuggestion.vue';

/**
 * Every style to try on the site, in place of the rest of the popup. It only
 * shows what `TheGallery` holds, which outlives it, as a preview does.
 */
export default Vue.extend({
  name: 'GalleryBrowser',

  components: {
    ChevronLeftIcon,
    GalleryLink,
    GallerySuggestion,
    SCallout,
    SHeading,
  },

  props: {
    styles: {
      type: Array as PropType<Array<GalleryStyle>>,
      required: true,
    },

    browseUrl: {
      type: String,
      required: true,
    },

    previewId: {
      type: Number as PropType<number | null>,
      default: null,
    },

    // The tab is still getting the picked style.
    loading: Boolean,

    error: {
      type: String,
      default: '',
    },
  },
});
</script>

<style lang="scss" scoped>
.header {
  display: flex;
  padding: 8px;
}

.back {
  @include button-reset;

  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  min-height: 28px;
  padding: 0 8px;
  border-radius: 7px;
  cursor: pointer;

  &:disabled {
    cursor: default;
  }

  @include hover-capable {
    &:hover:not(:disabled) {
      background: var(--hover-tint);
    }
  }

  @include focus-ring;
}

.back-icon {
  flex: none;
  margin-inline-start: -5px;

  .back:disabled & {
    opacity: 0.4;
  }
}

.title {
  @include truncate;

  min-width: 0;
}

.styles {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 380px;
  padding: 6px;
  overflow-y: auto;

  > * {
    flex: none;
  }
}

.more {
  padding: 6px;
}
</style>
