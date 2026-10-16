<template>
  <div class="field">
    <div class="field-heading">
      <s-text as="span" size="label" variant="muted">
        {{ t('screenshot') }}
      </s-text>
      <s-link-button
        v-if="screenshot"
        class="retake"
        :disabled="capturing"
        @click="$emit('capture')"
      >
        <camera-icon :size="15" />
        {{ t('retake') }}
      </s-link-button>
    </div>

    <button
      v-if="screenshot"
      type="button"
      class="screenshot reviewable"
      :aria-label="t('review_screenshot')"
      @click="$emit('review')"
    >
      <img :src="screenshot" :alt="t('screenshot')" />
    </button>

    <div v-else class="screenshot empty">
      <s-text as="span" variant="muted" class="empty-text">
        {{ t('captures_the_visible_part_of_this_tab') }}
      </s-text>
      <s-button :disabled="capturing" @click="$emit('capture')">
        <camera-icon :size="17" />
        {{ t('take_screenshot') }}
      </s-button>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { SButton, SLinkButton, SText } from '@stylebot/components';
import { CameraIcon } from '@stylebot/icons';

/**
 * The style's screenshot for the Gallery, or a way to take one. Emits
 * `capture` to take it, or take it again, and `review` when the image is
 * clicked, to check and blur it.
 */
export default Vue.extend({
  name: 'ScreenshotField',

  components: {
    SButton,
    SLinkButton,
    SText,
    CameraIcon,
  },

  props: {
    // A data URL, or empty before one is taken.
    screenshot: {
      type: String,
      default: '',
    },

    capturing: {
      type: Boolean,
      default: false,
    },
  },
});
</script>

<style lang="scss" scoped>
.field {
  display: flex;
  flex-direction: column;
  gap: 7px;
  min-width: 0;
}

.field-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.field-heading .retake {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
}

.screenshot {
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  border: 1px solid var(--panel-border);
  border-radius: 8px;
  background: var(--tab-surface);

  img {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: top center;
  }
}

.reviewable {
  @include button-reset;

  border: 1px solid var(--panel-border);
  cursor: zoom-in;

  @include focus-ring(2px);
}

.screenshot.empty {
  flex-direction: column;
  gap: 12px;
  border-style: dashed;
  border-color: var(--field-border);
}

.empty-text {
  max-width: 220px;
  text-align: center;
}
</style>
