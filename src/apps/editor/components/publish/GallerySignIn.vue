<template>
  <section class="sign-in">
    <s-text>{{ t('share_this_style_in_the_gallery') }}</s-text>
    <s-text size="caption" variant="muted">
      {{ t('the_gallery_never_sees_your_email') }}
    </s-text>

    <s-button
      variant="primary"
      class="sign-in-button"
      :disabled="signingIn"
      @click="signIn"
    >
      {{ signingIn ? t('signing_in') : t('sign_in_with_google') }}
    </s-button>

    <s-callout v-if="error" tone="danger">{{ error }}</s-callout>
  </section>
</template>

<script lang="ts">
import Vue from 'vue';
import { SButton, SCallout, SText } from '@stylebot/components';

import { signInToGallery } from '../../utils/gallery';
import { galleryErrorText } from '@stylebot/gallery';

/**
 * Asks to sign in to the Gallery with Google, and emits `signed-in` with the
 * account once that's done.
 */
export default Vue.extend({
  name: 'GallerySignIn',

  components: {
    SButton,
    SCallout,
    SText,
  },

  data(): { signingIn: boolean; error: string } {
    return {
      signingIn: false,
      error: '',
    };
  },

  methods: {
    async signIn(): Promise<void> {
      this.error = '';
      this.signingIn = true;

      const response = await signInToGallery();
      this.signingIn = false;

      if (!response.ok) {
        this.error = galleryErrorText(response);
      } else if (response.account) {
        this.$emit('signed-in', response.account);
      }
    },
  },
});
</script>

<style lang="scss" scoped>
.sign-in {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
}

.sign-in .sign-in-button {
  align-self: flex-start;
  margin-top: 6px;
}
</style>
