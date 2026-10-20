<template>
  <div class="publish-view">
    <subview-header :title="title" @back="back">
      <publish-menu
        v-if="editing"
        :style-data="target"
        :disabled="publishing"
        @sign-out="signOut"
        @unpublish="confirmingUnpublish = true"
      />
    </subview-header>

    <div class="view-body" :class="{ busy: publishing }">
      <template v-if="formVisible">
        <gallery-intro v-if="signedOut" />

        <div class="form" :class="{ locked: signedOut }" :inert="signedOut">
          <screenshot-field
            :screenshot="screenshot"
            :capturing="capturing"
            @capture="capture"
            @review="review"
          />

          <style-details-fields
            :name.sync="name"
            :description.sync="description"
            :notes.sync="notes"
            :username.sync="username"
            :current-username="account ? account.username : ''"
            :username-unavailable.sync="usernameUnavailable"
            :update="Boolean(target)"
          />
        </div>

        <s-callout v-if="error" tone="danger">{{ error }}</s-callout>
      </template>

      <published-style
        v-else-if="publishedResult"
        :style-data="publishedResult"
      />
    </div>

    <gallery-sign-in v-if="signedOut" @signed-in="showForm" />

    <publish-footer
      v-else-if="editing"
      :target="target"
      :publishing="publishing"
      :can-publish="canPublish"
      :has-changes="hasChanges"
      @publish="publish"
    />

    <div v-else-if="publishedResult" class="view-footer">
      <s-button
        variant="primary"
        size="large"
        @click="viewInGallery(publishedResult)"
      >
        {{ t('view_in_gallery') }} ↗
      </s-button>
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
import { SButton, SCallout, SConfirmDialog } from '@stylebot/components';
import { getGalleryStyleUrl, getGalleryUrl, hashCss } from '@stylebot/gallery';
import { getPageBridge } from '@stylebot/page-bridge';
import type {
  GalleryAccount,
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
  setGalleryUsername,
  signOutOfGallery,
  unpublishFromGallery,
} from '../../utils/gallery';

import { galleryErrorText } from '@stylebot/gallery';
import GalleryIntro from './GalleryIntro.vue';
import GallerySignIn from './GallerySignIn.vue';
import PublishedStyle from './PublishedStyle.vue';
import PublishFooter from './PublishFooter.vue';
import PublishMenu from './PublishMenu.vue';
import ScreenshotField from './ScreenshotField.vue';
import StyleDetailsFields from './StyleDetailsFields.vue';
import SubviewHeader from '../SubviewHeader.vue';

type Step = 'loading' | 'signed-out' | 'form' | 'published';

type Data = {
  step: Step;
  account: GalleryAccount | null;
  target: GalleryStyle | null;
  // The CSS hash of the version in the gallery, to tell if there's news.
  publishedCssHash: string;
  // Taken or blurred here, so it's a data URL to upload; otherwise it's the
  // gallery's, by URL.
  tookScreenshot: boolean;
  name: string;
  description: string;
  notes: string;
  username: string;
  usernameUnavailable: boolean;
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
    SubviewHeader,
    GalleryIntro,
    GallerySignIn,
    PublishedStyle,
    PublishFooter,
    PublishMenu,
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
      username: '',
      usernameUnavailable: false,
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
    signedOut(): boolean {
      return this.step === 'signed-out';
    },

    editing(): boolean {
      return this.step === 'form';
    },

    // Signed out too, locked until sign-in.
    formVisible(): boolean {
      return this.signedOut || this.editing;
    },

    publishedResult(): GalleryPublishedStyle | null {
      return this.step === 'published' ? this.published : null;
    },

    title(): string {
      if (this.publishedResult) {
        return this.publishedResult.name;
      }

      if (this.editing && this.target) {
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
        !this.usernameUnavailable &&
        Boolean(this.screenshot) &&
        Boolean(this.name.trim()) &&
        Boolean(this.$store.state.css.trim())
      );
    },
  },

  async mounted() {
    this.$store.commit('setInspecting', false);
    this.name = this.$store.getters.activeProfileName;

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

    showForm(account: GalleryAccount): void {
      this.account = account;
      this.username = account.username;
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

      // Signed out meanwhile.
      if (!this.editing) {
        return;
      }

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

        if (!this.tookScreenshot) {
          this.screenshot = getGalleryUrl(target.screenshot);
        }
      }
    },

    /**
     * The screenshot as a data URL, fetching the gallery's when it's still
     * the one shown, since the page can't blur or upload it by URL.
     */
    async screenshotDataUrl(): Promise<string | null> {
      if (this.tookScreenshot) {
        return this.screenshot;
      }

      const response = await getGalleryScreenshot(this.screenshot);

      if (!response.ok) {
        this.showError(response);
        return null;
      }

      return response.screenshot;
    },

    viewInGallery(style: GalleryStyle): void {
      window.open(getGalleryStyleUrl(style), '_blank', 'noopener');
    },

    async capture(): Promise<void> {
      const previous = {
        screenshot: this.screenshot,
        tookScreenshot: this.tookScreenshot,
      };

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

      // Cancelling the review of a new capture throws the capture away.
      if (!(await this.review())) {
        this.screenshot = previous.screenshot;
        this.tookScreenshot = previous.tookScreenshot;
        this.compressing = false;
      }
    },

    /**
     * Opens the screenshot over the page, where there's room to check it and
     * blur anything private, and keeps what the user blurred. Resolves with
     * whether they kept it rather than cancelling.
     */
    async review(): Promise<boolean> {
      const shown = await this.screenshotDataUrl();

      if (!shown) {
        return false;
      }

      const reviewed = await getPageBridge()
        .reviewScreenshot(shown)
        .catch(() => shown);

      // The review took the window's user to the page; bring them back.
      if (this.$store.state.host === 'window') {
        chrome.windows
          .getCurrent()
          .then(({ id }) => id && chrome.windows.update(id, { focused: true }))
          .catch(() => undefined);
      }

      if (!reviewed) {
        return false;
      }

      if (reviewed !== shown) {
        this.screenshot = reviewed;
        this.tookScreenshot = true;
        this.compress(reviewed);
      }

      return true;
    },

    /**
     * Shrinks a screenshot to fit the gallery's limit while it's on show,
     * unless another capture or a blur replaces it meanwhile.
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

    async publish(): Promise<void> {
      if (!this.canPublish || !this.account) {
        return;
      }

      this.error = '';
      this.publishing = true;

      try {
        // Publishing with the username the gallery made up confirms it.
        if (
          this.username !== this.account.username ||
          !this.account.usernameConfirmed
        ) {
          const named = await setGalleryUsername(this.username);

          if (!named.ok) {
            this.showError(named);
            return;
          }

          this.account = named.account;
        }

        // A first publish uploads one, even the gallery's after an unpublish.
        let screenshot: string | undefined;

        if (!this.target || this.tookScreenshot) {
          const dataUrl = await this.screenshotDataUrl();

          if (!dataUrl) {
            return;
          }

          screenshot = dataUrl;
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
          screenshot,
        });

        if (response.ok) {
          this.published = response.style;
          this.step = 'published';
        } else {
          this.showError(response);
          this.clearTargetIfNotFound(response);
        }
      } finally {
        this.publishing = false;
      }
    },

    /**
     * Back to the locked form, keeping the draft unless it was the published
     * style's, which belongs to the account signed out of.
     */
    async signOut(): Promise<void> {
      this.error = '';

      const response = await signOutOfGallery();

      if (!response.ok) {
        this.showError(response);
        return;
      }

      if (this.target) {
        this.name = this.$store.getters.activeProfileName;
        this.description = '';
        this.screenshot = '';
        this.tookScreenshot = false;
        this.publishedCssHash = '';
        this.target = null;
      }

      this.account = null;
      this.username = '';
      this.usernameUnavailable = false;
      this.step = 'signed-out';
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
        this.clearTargetIfNotFound(response);
      }
    },

    /**
     * Goes back to a first publish when the style was unpublished or deleted
     * on the website, which the background has forgotten too.
     */
    clearTargetIfNotFound({ errorKey }: GalleryFailure): void {
      if (errorKey === 'gallery_error_not_found') {
        this.target = null;
        this.$store.commit('setPublishedGalleryStyle', null);
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

.form {
  display: flex;
  flex-direction: column;
  gap: 18px;
  transition: opacity 0.15s;

  &.locked {
    opacity: 0.45;
  }
}

.view-footer {
  flex: none;
  display: flex;
  padding: 14px;
  border-top: 1px solid var(--panel-border);
}

.view-footer .button {
  flex: 1;
}
</style>
