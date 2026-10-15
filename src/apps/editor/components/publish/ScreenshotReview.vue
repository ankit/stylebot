<template>
  <div
    ref="root"
    class="review"
    role="dialog"
    aria-modal="true"
    :aria-label="t('review_screenshot')"
    tabindex="-1"
    @keydown.esc.stop.prevent="$emit('close')"
  >
    <s-theme-provider mode="dark">
      <div class="review-bar">
        <div class="review-heading">
          <s-heading as="h2" size="md">{{ t('review_screenshot') }}</s-heading>
          <s-text size="caption" variant="muted">
            {{ t('drag_over_anything_private_to_blur_it') }}
          </s-text>
        </div>

        <s-button v-if="boxes.length" @click="undo">{{ t('undo') }}</s-button>
        <s-button @click="$emit('close')">{{ t('cancel') }}</s-button>
        <s-button variant="primary" :disabled="applying" @click="done">
          {{ t('done') }}
        </s-button>
      </div>
    </s-theme-provider>

    <div class="review-stage" @pointerdown.self="selected = -1">
      <div
        ref="frame"
        class="frame"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
      >
        <img
          ref="image"
          :src="screenshot"
          :alt="t('screenshot')"
          draggable="false"
        />

        <div
          v-for="(box, index) in shownBoxes"
          :key="index"
          class="box"
          :class="{ selected: index === selected }"
          :style="boxStyle(box)"
          @pointerdown.stop="selected = index"
        >
          <button
            v-if="index === selected"
            type="button"
            class="remove"
            :aria-label="t('remove_blur')"
            @pointerdown.stop
            @click="remove(index)"
          >
            <x-icon :size="10" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { SButton, SHeading, SText, SThemeProvider } from '@stylebot/components';
import { XIcon } from '@stylebot/icons';

import type { BlurArea } from '../../utils/blur-screenshot';
import { blurScreenshotAreas } from '../../utils/blur-screenshot';

// Smaller drags are taken as clicks.
const MIN_BOX = 0.01;
// The preview's blur radius in screen pixels; the result matches it.
const BLUR_PX = 12;

const clamp = (value: number): number => Math.min(Math.max(value, 0), 1);

/**
 * Shows a screenshot at nearly the window's size for the user to check, and
 * to blur anything private by dragging boxes over it. On Done the blur goes
 * into the pixels and `done` has the result; `close` means nothing changed.
 */
export default Vue.extend({
  name: 'ScreenshotReview',

  components: {
    SButton,
    SHeading,
    SText,
    SThemeProvider,
    XIcon,
  },

  props: {
    screenshot: {
      type: String,
      required: true,
    },
  },

  data(): {
    boxes: Array<BlurArea>;
    drawing: BlurArea | null;
    start: { x: number; y: number } | null;
    selected: number;
    applying: boolean;
  } {
    return {
      boxes: [],
      drawing: null,
      start: null,
      selected: -1,
      applying: false,
    };
  },

  computed: {
    shownBoxes(): Array<BlurArea> {
      return this.drawing ? [...this.boxes, this.drawing] : this.boxes;
    },
  },

  mounted() {
    (this.$refs.root as HTMLElement).focus();
  },

  methods: {
    boxStyle(box: BlurArea): Record<string, string> {
      return {
        left: `${box.x * 100}%`,
        top: `${box.y * 100}%`,
        width: `${box.width * 100}%`,
        height: `${box.height * 100}%`,
      };
    },

    pointFor(event: PointerEvent): { x: number; y: number } {
      const rect = (this.$refs.frame as HTMLElement).getBoundingClientRect();

      return {
        x: clamp((event.clientX - rect.left) / rect.width),
        y: clamp((event.clientY - rect.top) / rect.height),
      };
    },

    onPointerDown(event: PointerEvent): void {
      if (event.button !== 0) {
        return;
      }

      event.preventDefault();
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
      this.selected = -1;
      this.start = this.pointFor(event);
      this.drawing = { ...this.start, width: 0, height: 0 };
    },

    onPointerMove(event: PointerEvent): void {
      if (!this.start) {
        return;
      }

      const point = this.pointFor(event);

      this.drawing = {
        x: Math.min(this.start.x, point.x),
        y: Math.min(this.start.y, point.y),
        width: Math.abs(point.x - this.start.x),
        height: Math.abs(point.y - this.start.y),
      };
    },

    onPointerUp(): void {
      const box = this.drawing;

      this.start = null;
      this.drawing = null;

      if (box && box.width > MIN_BOX && box.height > MIN_BOX) {
        this.boxes.push(box);
        this.selected = this.boxes.length - 1;
      }
    },

    remove(index: number): void {
      this.boxes.splice(index, 1);
      this.selected = -1;
    },

    undo(): void {
      this.boxes.pop();
      this.selected = -1;
    },

    /**
     * Blurs the boxes into the image and hands back the result, or closes
     * without boxes, keeping the screenshot as it is.
     */
    async done(): Promise<void> {
      if (!this.boxes.length) {
        this.$emit('close');
        return;
      }

      this.applying = true;

      const image = this.$refs.image as HTMLImageElement;
      await image.decode();

      // The preview blurs at screen size; scale the radius to the image's.
      const frame = this.$refs.frame as HTMLElement;
      const radius = BLUR_PX * (image.naturalWidth / frame.clientWidth);

      this.$emit('done', blurScreenshotAreas(image, this.boxes, radius));
    },
  },
});
</script>

<style lang="scss" scoped>
.review {
  position: fixed;
  inset: 0;
  z-index: 2147483647;
  display: flex;
  flex-direction: column;
  background: rgba(10, 11, 13, 0.82);
  outline: none;
}

.review-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 20px;
}

.review-heading {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
  gap: 2px;
}

.review-stage {
  flex: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.frame {
  position: relative;
  max-width: 100%;
  max-height: 100%;
  cursor: crosshair;
  touch-action: none;
  user-select: none;

  img {
    display: block;
    max-width: 100%;
    max-height: calc(100vh - 120px);
    border-radius: 8px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  }
}

.box {
  position: absolute;
  box-sizing: border-box;
  border-radius: 4px;
  outline: 1px dashed rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(12px);
  cursor: pointer;

  &.selected {
    outline: 2px solid var(--accent);
  }
}

.remove {
  @include button-reset;

  position: absolute;
  top: -10px;
  right: -10px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 10px;
  color: var(--accent-ink);
  background: var(--accent);
  cursor: pointer;

  @include focus-ring(2px);
}
</style>
