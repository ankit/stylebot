<template>
  <s-theme-provider class="root" :mode="appearance">
    <div
      ref="bar"
      class="preview"
      :class="{ leaving, resizing }"
      role="region"
      :aria-label="t('preview')"
      @mouseenter="pause"
      @mouseleave="onMouseLeave"
      @animationend.self="onAnimationEnd"
    >
      <install-confirmation
        v-if="phase === 'done'"
        :style-data="styleData"
        :undoing="undoing"
        @undo="undo"
        @dismiss="dismiss"
      />

      <preview-controls
        v-else
        :style-data="styleData"
        :installing="installing"
        @compare="handlers.compare"
        @install="install"
        @filled="filled = true"
        @cancel="cancel"
      />

      <s-text v-if="error" as="p" size="caption" class="error" role="alert">
        {{ error }}
      </s-text>
    </div>
  </s-theme-provider>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';
import { SText, SThemeProvider } from '@stylebot/components';
import {
  galleryErrorText,
  type GalleryPreviewHandlers,
} from '@stylebot/gallery';
import type { GalleryStyle, StylebotAppearance } from '@stylebot/types';

import InstallConfirmation from './InstallConfirmation.vue';
import PreviewControls from './PreviewControls.vue';

type Phase = 'preview' | 'installing' | 'done';

const CONFIRM_MS = 4000;
const CONFIRM_AFTER_HOVER_MS = 2000;

const reducesMotion = (): boolean =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Whether a key press belongs to something the user is typing in.
 */
const isTyping = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement &&
  (target.isContentEditable ||
    ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

/**
 * The controls a page shows while it previews a gallery style, to install it,
 * cancel (or press Esc), or hold to compare (or hold C) with the page's own
 * styles.
 * Once installed they confirm it, with an undo, then emit `done`.
 */
export default Vue.extend({
  name: 'GalleryPreview',

  components: {
    InstallConfirmation,
    PreviewControls,
    SText,
    SThemeProvider,
  },

  props: {
    styleData: {
      type: Object as PropType<GalleryStyle>,
      required: true,
    },

    handlers: {
      type: Object as PropType<GalleryPreviewHandlers>,
      required: true,
    },

    appearance: {
      type: String as PropType<StylebotAppearance>,
      default: 'system',
    },

    installed: {
      type: Boolean,
      default: false,
    },
  },

  data() {
    return {
      phase: 'preview' as Phase,
      filled: false,
      undoing: false,
      leaving: false,
      resizing: false,
      error: '',
      timer: 0,
    };
  },

  computed: {
    installing(): boolean {
      return this.phase === 'installing';
    },

    // Installed from the bar, once its button has filled; from the popup, at once.
    confirmable(): boolean {
      return this.installed && (this.filled || !this.installing);
    },
  },

  watch: {
    // Runs before the bar re-renders, so it can read the width it had.
    async phase(): Promise<void> {
      const bar = this.$refs.bar as HTMLElement;
      const from = bar.offsetWidth;

      await this.$nextTick();

      const to = bar.offsetWidth;

      if (from !== to && !reducesMotion()) {
        this.resizing = true;

        const resize = bar.animate(
          [{ width: `${from}px` }, { width: `${to}px` }],
          { duration: 380, easing: 'cubic-bezier(0.3, 0.8, 0.2, 1)' }
        );

        resize.onfinish = resize.oncancel = () => (this.resizing = false);
      }
    },

    confirmable(confirmable: boolean): void {
      if (confirmable) {
        this.confirm();
      }
    },
  },

  mounted() {
    window.addEventListener('keydown', this.onKeydown);
  },

  beforeDestroy() {
    window.removeEventListener('keydown', this.onKeydown);
    clearTimeout(this.timer);
  },

  methods: {
    onKeydown(event: KeyboardEvent): void {
      const isEscape =
        event.key === 'Escape' &&
        event.isTrusted &&
        !event.defaultPrevented &&
        !isTyping(event.target);

      if (!isEscape) {
        return;
      }

      if (this.phase === 'done') {
        this.dismiss();
      } else if (!this.installing) {
        this.cancel();
      }
    },

    cancel(): void {
      this.handlers.cancel();
    },

    async install(): Promise<void> {
      this.error = '';
      this.filled = false;
      this.phase = 'installing';

      const response = await this.handlers.install();

      // A successful install ends the preview, which sets `installed`.
      if (!response.ok) {
        this.phase = 'preview';
        this.error = galleryErrorText(response);
      }
    },

    confirm(): void {
      this.phase = 'done';
      this.resume(CONFIRM_MS);
    },

    pause(): void {
      clearTimeout(this.timer);
    },

    onMouseLeave(): void {
      this.resume(CONFIRM_AFTER_HOVER_MS);
    },

    resume(ms: number): void {
      clearTimeout(this.timer);

      if (this.phase === 'done' && !this.undoing) {
        this.timer = window.setTimeout(this.dismiss, ms);
      }
    },

    async undo(): Promise<void> {
      this.pause();
      this.undoing = true;
      this.error = '';

      const response = await this.handlers.undo();

      // An undone install previews the style again, replacing this.
      if (!response.ok) {
        this.undoing = false;
        this.error = galleryErrorText(response);
        this.resume(CONFIRM_MS);
      }
    },

    dismiss(): void {
      this.pause();
      this.leaving = true;
    },

    onAnimationEnd(): void {
      if (this.leaving) {
        this.$emit('done');
      }
    },
  },
});
</script>

<style lang="scss" scoped>
.root {
  min-width: 0;
  max-width: 720px;
  background: none;
}

.preview {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  box-sizing: border-box;
  padding: 10px;
  border: 1px solid var(--field-border);
  border-radius: 14px;
  background: var(--panel-surface);
  box-shadow: 0 8px 24px rgb(0 0 0 / 12%);
  pointer-events: auto;
  animation: rise 180ms cubic-bezier(0.2, 0.8, 0.2, 1);

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
}

.preview.resizing {
  flex-wrap: nowrap;
  overflow: hidden;

  ::v-deep .summary {
    flex: none;
  }
}

.preview.leaving {
  animation: leave 260ms ease-in forwards;

  @media (prefers-reduced-motion: reduce) {
    animation-name: fade;
  }
}

.error {
  flex-basis: 100%;
  padding: 0 2px;
  color: var(--danger);
}

@keyframes leave {
  to {
    opacity: 0;
    transform: translateY(16px);
  }
}

@keyframes fade {
  to {
    opacity: 0;
  }
}

@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
}
</style>
