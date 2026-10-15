<template>
  <section class="published">
    <div class="summary">
      <span class="check"><check-icon :size="14" /></span>
      <div class="summary-text">
        <s-heading as="h2" size="md">
          {{ t('version_number_is_live', [String(styleData.version)]) }}
        </s-heading>
        <s-text variant="muted">{{ detail }}</s-text>
      </div>
    </div>

    <img class="screenshot" :src="screenshotUrl" :alt="t('screenshot')" />

    <div class="field">
      <s-text as="span" size="label" variant="muted">{{ t('link') }}</s-text>
      <div class="link-row">
        <span class="link">
          <span class="link-base">{{ link.base }}</span>
          <span class="link-slug">{{ link.slug }}</span>
        </span>
        <s-copy-button :text="styleUrl" />
      </div>
    </div>

    <s-callout v-if="styleData.removed.length" tone="warning">
      {{ t('the_gallery_took_these_out') }}
      <ul class="removed-list">
        <li v-for="(each, index) in styleData.removed" :key="index">
          {{ each }}
        </li>
      </ul>
    </s-callout>
  </section>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';
import { SCallout, SCopyButton, SHeading, SText } from '@stylebot/components';
import { CheckIcon } from '@stylebot/icons';
import { getGalleryStyleUrl, getGalleryUrl } from '@stylebot/gallery';
import type { GalleryPublishedStyle } from '@stylebot/types';

/**
 * What the gallery published, its link, and anything it took out of the CSS.
 */
export default Vue.extend({
  name: 'PublishedStyle',

  components: {
    SCallout,
    SCopyButton,
    SHeading,
    SText,
    CheckIcon,
  },

  props: {
    styleData: {
      type: Object as PropType<GalleryPublishedStyle>,
      required: true,
    },
  },

  computed: {
    // An update reaches people who installed it; a new style is just out.
    detail(): string {
      if (this.styleData.version > 1) {
        return this.t('installed_copies_update_within_a_day');
      }

      return this.t('anyone_can_install_it_from_the_gallery');
    },

    screenshotUrl(): string {
      return getGalleryUrl(this.styleData.screenshot);
    },

    styleUrl(): string {
      return getGalleryStyleUrl(this.styleData);
    },

    // The link without its scheme, split so the style's own part stands out.
    link(): { base: string; slug: string } {
      const bare = this.styleUrl.replace(/^https?:\/\//, '');
      const slash = bare.lastIndexOf('/') + 1;

      return { base: bare.slice(0, slash), slug: bare.slice(slash) };
    },
  },
});
</script>

<style lang="scss" scoped>
.published {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin: 0;
}

.summary {
  display: flex;
  align-items: center;
  gap: 12px;
}

.check {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 15px;
  color: var(--success);
  background: var(--success-background);
}

.summary-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.screenshot {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 10;
  border: 1px solid var(--panel-border);
  border-radius: 8px;
  object-fit: cover;
  object-position: top center;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.link-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 6px 6px 12px;
  border-radius: 8px;
  background: var(--field-surface);
}

.link {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  line-height: 1.4;
  overflow-wrap: anywhere;
}

.link-base {
  color: var(--text-muted);
}

.link-slug {
  font-weight: 500;
  color: var(--text-primary);
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
