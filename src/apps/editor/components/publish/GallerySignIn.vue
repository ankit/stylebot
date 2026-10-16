<template>
  <div class="sign-in">
    <s-callout v-if="error" tone="danger">{{ error }}</s-callout>

    <s-button
      variant="primary"
      size="large"
      :disabled="signingIn"
      @click="signIn"
    >
      {{ signingIn ? t('signing_in') : t('sign_in_with_google_to_publish') }}
    </s-button>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { SButton, SCallout } from '@stylebot/components';

import { signInToGallery } from '../../utils/gallery';
import { galleryErrorText } from '@stylebot/gallery';

/**
 * The publish view's footer while signed out: signs in to the Gallery with
 * Google, and emits `signed-in` with the account once that's done.
 */
export default Vue.extend({
  name: 'GallerySignIn',

  components: {
    SButton,
    SCallout,
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
  flex: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 14px;
  border-top: 1px solid var(--panel-border);
}
</style>
