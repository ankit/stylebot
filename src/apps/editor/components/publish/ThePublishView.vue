<template>
  <div class="publish-view">
    <subview-header :title="title" @back="back">
      <published-style-menu
        v-if="step === 'form' && target"
        :style-data="target"
        :disabled="publishing"
        @unpublish="confirmingUnpublish = true"
      />
    </subview-header>

    <div class="view-body" :class="{ busy: publishing }">
      <gallery-sign-in v-if="step === 'signed-out'" @signed-in="showForm" />

      <template v-else-if="step === 'form'">
        <screenshot-field
          :screenshot="screenshot"
          :capturing="capturing"
          @capture="capture"
        />

        <style-details-fields
          :name.sync="name"
          :description.sync="description"
          :notes.sync="notes"
          :display-name.sync="displayName"
          :update="Boolean(target)"
          @author-change="saveDisplayName"
        />

        <s-callout v-if="error" tone="danger">{{ error }}</s-callout>
      </template>

      <published-style
        v-else-if="step === 'published' && published"
        :style-data="published"
      />
    </div>

    <publish-footer
      v-if="step === 'form'"
      :target="target"
      :publishing="publishing"
      :can-publish="canPublish"
      :has-changes="hasChanges"
      @publish="publish"
    />

    <div v-else-if="step === 'published' && published" class="view-footer">
      <s-link-button class="view-link" @click="viewInGallery(published)">
        {{ t('view_in_gallery') }}
      </s-link-button>
      <s-button @click="back">{{ t('done') }}</s-button>
    </div>

    <s-confirm-dialog
      v-if="confirmingUnpublish && target"
      contained
      size="small"
      :title="t('unpublish_name', [target.name])"
      :message="t('existing_installs_keep_working_but_stop_getting_updates')"
      :confirm-label="t('unpublish')"
      :cancel-label="t('cancel')"
      @cancel="confirmingUnpublish = false"
      @confirm="unpublish"
    />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import {
  SButton,
  SCallout,
  SConfirmDialog,
  SLinkButton,
} from '@stylebot/components';
import { getGalleryStyleUrl, hashCss } from '@stylebot/gallery';
import type {
  GalleryAuthor,
  GalleryFailure,
  GalleryPublishedStyle,
  GalleryStyle,
} from '@stylebot/types';

import {
  compressGalleryScreenshot,
  getGalleryAccount,
  getGalleryScreenshot,
  getMyGalleryStyles,
  getPublishedGalleryStyle,
  publishToGallery,
  setGalleryDisplayName,
  unpublishFromGallery,
} from '../../utils/gallery';

import { galleryErrorText } from './gallery-error';
import GallerySignIn from './GallerySignIn.vue';
import PublishedStyle from './PublishedStyle.vue';
import PublishedStyleMenu from './PublishedStyleMenu.vue';
import PublishFooter from './PublishFooter.vue';
import ScreenshotField from './ScreenshotField.vue';
import StyleDetailsFields from './StyleDetailsFields.vue';
import SubviewHeader from '../SubviewHeader.vue';

type Step = 'loading' | 'signed-out' | 'form' | 'published';

type Data = {
  step: Step;
  account: GalleryAuthor | null;
  target: GalleryStyle | null;
  // The CSS hash of the version in the gallery, to tell if there's news.
  publishedCssHash: string;
  tookScreenshot: boolean;
  name: string;
  description: string;
  notes: string;
  displayName: string;
  screenshot: string;
  capturing: boolean;
  // Shrinking a capture to fit the gallery's limit, after showing it as taken.
  compressing: boolean;
  publishing: boolean;
  confirmingUnpublish: boolean;
  error: string;
  published: GalleryPublishedStyle | null;
};

export default Vue.extend({
  name: 'ThePublishView',

  components: {
    SButton,
    SCallout,
    SConfirmDialog,
    SLinkButton,
    SubviewHeader,
    GallerySignIn,
    PublishedStyle,
    PublishedStyleMenu,
    PublishFooter,
    ScreenshotField,
    StyleDetailsFields,
  },

  data(): Data {
    return {
      step: 'loading',
      account: null,
      target: null,
      publishedCssHash: '',
      tookScreenshot: false,
      name: '',
      description: '',
      notes: '',
      displayName: '',
      screenshot: '',
      capturing: false,
      compressing: false,
      publishing: false,
      confirmingUnpublish: false,
      error: '',
      published: null,
    };
  },

  computed: {
    title(): string {
      if (this.step === 'published' && this.published) {
        return this.published.name;
      }

      if (this.step === 'form' && this.target) {
        return this.t('update_name', [this.target.name]);
      }

      return this.t('publish_to_gallery');
    },

    // An update needs something new; the author is the account's, not a version's.
    hasChanges(): boolean {
      if (!this.target) {
        return true;
      }

      return (
        this.tookScreenshot ||
        hashCss(this.$store.state.css) !== this.publishedCssHash ||
        this.name.trim() !== this.target.name ||
        this.description.trim() !== (this.target.description ?? '')
      );
    },

    canPublish(): boolean {
      return (
        this.hasChanges &&
        !this.publishing &&
        !this.capturing &&
        !this.compressing &&
        Boolean(this.screenshot) &&
        Boolean(this.name.trim()) &&
        Boolean(this.$store.state.css.trim())
      );
    },
  },

  async mounted() {
    this.$store.commit('setInspecting', false);

    const response = await getGalleryAccount();

    if (response.ok && response.account) {
      this.showForm(response.account);
    } else {
      this.step = 'signed-out';
    }
  },

  methods: {
    back(): void {
      this.$store.commit('setPublishing', false);
    },

    showError(failure: GalleryFailure): void {
      this.error = galleryErrorText(failure);
    },

    showForm(account: GalleryAuthor): void {
      const { profiles, activeProfile } = this.$store.state;

      this.account = account;
      this.displayName = account.name ?? '';
      this.name =
        profiles.find((each: { id: string }) => each.id === activeProfile)
          ?.name ?? '';
      this.step = 'form';

      this.loadTarget();
    },

    /**
     * Finds the gallery style published from this style's profile, which
     * publishing updates.
     */
    async loadTarget(): Promise<void> {
      const { url, activeProfile } = this.$store.state;
      const [response, { published }] = await Promise.all([
        getMyGalleryStyles({ site: url, url, profileId: activeProfile }),
        getPublishedGalleryStyle(url, activeProfile),
      ]);

      if (!response.ok) {
        this.showError(response);
        return;
      }

      const target = response.styles.find(
        style => style.id === response.publishedId
      );

      if (target) {
        this.target = target;
        this.name = target.name;
        this.description = target.description ?? '';
        this.publishedCssHash = published?.cssHash ?? '';
        this.loadScreenshot(target.screenshot);
      }
    },

    /**
     * Starts an update from the screenshot the gallery shows now, unless one
     * was taken in the meantime.
     */
    async loadScreenshot(path: string): Promise<void> {
      const response = await getGalleryScreenshot(path);

      if (response.ok && !this.screenshot) {
        this.screenshot = response.screenshot;
      }
    },

    viewInGallery(style: GalleryStyle): void {
      window.open(getGalleryStyleUrl(style), '_blank', 'noopener');
    },

    async capture(): Promise<void> {
      this.capturing = true;

      const response = await this.$store.dispatch('captureGalleryScreenshot');
      this.capturing = false;

      if (!response.ok) {
        this.showError(response);
        return;
      }

      this.screenshot = response.screenshot;
      this.tookScreenshot = true;
      this.compress(response.screenshot);
    },

    /**
     * Shrinks a capture to fit the gallery's limit while it's on show, unless
     * another capture replaces it meanwhile.
     */
    async compress(screenshot: string): Promise<void> {
      this.compressing = true;

      const response = await compressGalleryScreenshot(screenshot);

      if (this.screenshot !== screenshot) {
        return;
      }

      this.compressing = false;

      if (response.ok) {
        this.screenshot = response.screenshot;
      } else {
        this.showError(response);
      }
    },

    async saveDisplayName(): Promise<void> {
      const displayName = this.displayName.trim();

      if (!this.account || displayName === (this.account.name ?? '')) {
        return;
      }

      const response = await setGalleryDisplayName(displayName);

      if (response.ok) {
        this.account = response.account;
      } else {
        this.showError(response);
      }
    },

    async publish(): Promise<void> {
      if (!this.canPublish || !this.account) {
        return;
      }

      this.error = '';
      this.publishing = true;

      try {
        const displayName = this.displayName.trim();

        if (displayName !== (this.account.name ?? '')) {
          const named = await setGalleryDisplayName(displayName);

          if (!named.ok) {
            this.showError(named);
            return;
          }

          this.account = named.account;
        }

        const { url, activeProfile, css } = this.$store.state;
        const response = await publishToGallery({
          styleId: this.target?.id,
          site: url,
          url,
          profileId: activeProfile,
          title: this.name.trim(),
          description: this.description.trim(),
          notes: this.notes.trim(),
          css,
          screenshot: this.screenshot,
        });

        if (response.ok) {
          this.published = response.style;
          this.step = 'published';
        } else {
          this.showError(response);
        }
      } finally {
        this.publishing = false;
      }
    },

    async unpublish(): Promise<void> {
      if (!this.target) {
        return;
      }

      this.confirmingUnpublish = false;
      this.error = '';

      const response = await unpublishFromGallery(this.target.id);

      // Back to a first publish, keeping the details for republishing.
      if (response.ok) {
        this.target = null;
      } else {
        this.showError(response);
      }
    },
  },
});
</script>

<style lang="scss" scoped>
.publish-view {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  background: var(--panel-surface);
}

.view-body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 16px;
  transition: opacity 0.15s;

  &.busy {
    opacity: 0.55;
    pointer-events: none;
  }

  @include thin-scrollbar;
}

.view-footer {
  flex: none;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 12px 12px 16px;
  border-top: 1px solid var(--panel-border);
}

.view-footer .button {
  padding: 10px 16px;
  font-size: 14px;
}

.view-footer .view-link {
  flex: 1;
  font-size: 14px;
  text-align: left;
}
</style>
