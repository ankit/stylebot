<template>
  <div class="unsupported-page">
    <div class="popup-header-title">
      <s-heading as="h1" size="md" class="popup-header-domain">
        {{ name }}
      </s-heading>
      <options-button />
    </div>

    <button
      v-if="page.needsFileAccess"
      type="button"
      class="file-access-link"
      @click="openExtensionDetails"
    >
      <s-text as="span" size="large" variant="primary">
        {{ t(page.reasonKey) }}
      </s-text>
    </button>
    <s-text v-else size="large" variant="muted">
      {{ t(page.reasonKey) }}
    </s-text>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { SHeading, SText } from '@stylebot/components';

import OptionsButton from './OptionsButton.vue';
import { openExtensionDetails } from '../utils';
import { describeUnsupportedPage } from '../unsupported-page';
import type { UnsupportedPage } from '../unsupported-page';

export default Vue.extend({
  name: 'UnsupportedPage',

  components: {
    SHeading,
    SText,
    OptionsButton,
  },

  props: {
    url: {
      type: String,
      required: true,
    },
  },

  computed: {
    page(): UnsupportedPage {
      return describeUnsupportedPage(this.url);
    },

    name(): string {
      if (this.page.nameKey) {
        return this.t(this.page.nameKey);
      }

      try {
        return new URL(this.url).hostname;
      } catch {
        return this.url;
      }
    },
  },

  methods: {
    openExtensionDetails,
  },
});
</script>

<style lang="scss" scoped>
.unsupported-page {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px 16px 14px;
}

.file-access-link {
  @include button-reset;

  text-align: left;
  color: var(--accent-text);
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }

  @include focus-ring;
}
</style>
