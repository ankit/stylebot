<template>
  <section class="published">
    <div class="summary">
      <s-heading as="h2" size="md" class="status">
        <s-status-dot tone="success" />
        {{
          t('version_number_is_live_in_the_gallery', [
            String(styleData.version),
          ])
        }}
      </s-heading>
      <s-thumbnail :src="screenshotUrl" :alt="t('screenshot')" />
    </div>

    <div class="link-field">
      <s-tooltip :text="styleUrl" grow>
        <span class="link">
          <span class="link-base">{{ link.base }}</span>
          <span class="link-slug">{{ link.slug }}</span>
        </span>
      </s-tooltip>
      <s-copy-button :text="styleUrl" :label="t('copy')" />
    </div>

    <s-callout v-if="styleData.removed.length" tone="warning">
      {{ t('the_gallery_took_these_out') }}
      <ul class="removed-list">
        <li v-for="(each, index) in styleData.removed" :key="index">
          {{ each }}
        </li>
      </ul>
    </s-callout>

    <hr class="divider" />

    <s-text variant="muted">
      {{ t('edits_stay_on_your_device_until_you_publish_an_update') }}
    </s-text>

    <s-button variant="primary" size="large" @click="viewInGallery">
      {{ t('view_in_gallery') }} ↗
    </s-button>
  </section>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';
import {
  SButton,
  SCallout,
  SCopyButton,
  SHeading,
  SStatusDot,
  SText,
  SThumbnail,
  STooltip,
} from '@stylebot/components';
import { getGalleryStyleUrl, getGalleryUrl } from '@stylebot/gallery';
import type { GalleryPublishedStyle } from '@stylebot/types';

/**
 * What the gallery published, its link to copy, anything it took out of the
 * CSS, and a button to see it there.
 */
export default Vue.extend({
  name: 'PublishedStyle',

  components: {
    SButton,
    SCallout,
    SCopyButton,
    SHeading,
    SStatusDot,
    SText,
    SThumbnail,
    STooltip,
  },

  props: {
    styleData: {
      type: Object as PropType<GalleryPublishedStyle>,
      required: true,
    },
  },

  computed: {
    screenshotUrl(): string {
      return getGalleryUrl(this.styleData.screenshot);
    },

    styleUrl(): string {
      return getGalleryStyleUrl(this.styleData);
    },

    // The site and slug, which tell styles apart; the site gives way when long.
    link(): { base: string; slug: string } {
      return {
        base: `${this.styleData.site.replace(/^www\./, '')}/`,
        slug: this.styleData.slug,
      };
    },
  },

  methods: {
    viewInGallery(): void {
      window.open(this.styleUrl, '_blank', 'noopener');
    },
  },
});
</script>

<style lang="scss" scoped>
.published {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin: 0;
}

.summary {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.summary .status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.link-field {
  @include field-border(8px);

  display: flex;
  align-items: center;
  gap: 8px;
  height: 36px;
  box-sizing: border-box;
  padding: 0 4px 0 10px;
  background: var(--field-surface);
}

.link {
  display: flex;
  font-size: 13px;
  white-space: nowrap;
}

.link-base {
  @include truncate;

  min-width: 0;
  color: var(--text-muted);
}

.link-slug {
  flex: none;
  color: var(--text-primary);
}

.divider {
  margin: 0;
  border: 0;
  border-top: 1px solid var(--panel-border);
}

.removed-list {
  margin: 6px 0 0;
  padding: 0 0 0 16px;
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 18px;
  color: var(--text-body);
  word-break: break-all;
}
</style>
