<template>
  <s-theme-provider class="root" :mode="appearance">
    <div class="preview" role="region" :aria-label="t('preview')">
      <span class="summary">
        <s-thumbnail :src="thumbnail" :width="69" :height="43" />
        <span class="details">
          <s-text
            as="a"
            size="large"
            class="name"
            :href="styleUrl"
            :title="styleData.name"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ styleData.name }}
          </s-text>
          <s-text as="span" variant="muted" class="status">
            {{
              held
                ? t('showing_the_page_as_it_was')
                : t('preview_not_installed')
            }}
          </s-text>
        </span>
      </span>

      <span class="divider" />

      <s-button
        class="compare"
        :class="{ held }"
        :disabled="installing"
        @pointerdown.native="hold($event)"
        @pointerup.native="release"
        @pointercancel.native="release"
        @lostpointercapture.native="release"
        @blur.native="release"
        @keydown.native.space.prevent="setHeld(true)"
        @keydown.native.enter.prevent="setHeld(true)"
        @keyup.native="release"
      >
        {{ t('hold_to_compare') }}
      </s-button>
      <s-button variant="primary" :disabled="installing" @click="install">
        {{ installing ? t('installing') : t('install') }}
      </s-button>
      <s-icon-button
        class="close"
        :size="33"
        :title="t('cancel_preview_esc')"
        :aria-label="t('cancel_preview_esc')"
        :disabled="installing"
        @click="cancel"
      >
        <x-icon :size="14" />
      </s-icon-button>

      <s-text v-if="error" as="p" size="caption" class="error" role="alert">
        {{ error }}
      </s-text>
    </div>
  </s-theme-provider>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';
import {
  SButton,
  SIconButton,
  SText,
  SThemeProvider,
  SThumbnail,
} from '@stylebot/components';
import { XIcon } from '@stylebot/icons';
import {
  galleryErrorText,
  getGalleryStyleUrl,
  getGalleryUrl,
  type GalleryPreviewHandlers,
} from '@stylebot/gallery';
import type { GalleryStyle, StylebotAppearance } from '@stylebot/types';

/**
 * Whether a key press belongs to something the user is typing in.
 */
const isTyping = (target: EventTarget | null): boolean =>
  target instanceof HTMLElement &&
  (target.isContentEditable ||
    ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

/**
 * The controls a page shows while it previews a gallery style, to install it,
 * cancel (or press Esc), or hold to compare with the page's own styles.
 */
export default Vue.extend({
  name: 'GalleryPreview',

  components: {
    SButton,
    SIconButton,
    SText,
    SThemeProvider,
    SThumbnail,
    XIcon,
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
  },

  data() {
    return {
      held: false,
      installing: false,
      error: '',
    };
  },

  computed: {
    thumbnail(): string {
      return getGalleryUrl(this.styleData.screenshot);
    },

    styleUrl(): string {
      return getGalleryStyleUrl(this.styleData);
    },
  },

  mounted() {
    window.addEventListener('keydown', this.onKeydown);
  },

  beforeDestroy() {
    window.removeEventListener('keydown', this.onKeydown);
  },

  methods: {
    onKeydown(event: KeyboardEvent): void {
      if (
        event.key === 'Escape' &&
        event.isTrusted &&
        !event.defaultPrevented &&
        !this.installing &&
        !isTyping(event.target)
      ) {
        this.cancel();
      }
    },

    setHeld(held: boolean): void {
      if (this.held !== held) {
        this.held = held;
        this.handlers.compare(held);
      }
    },

    hold(event: PointerEvent): void {
      (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
      this.setHeld(true);
    },

    release(): void {
      this.setHeld(false);
    },

    cancel(): void {
      this.handlers.cancel();
    },

    async install(): Promise<void> {
      this.installing = true;
      this.error = '';

      const response = await this.handlers.install();

      // A successful install ends the preview, unmounting this.
      if (!response.ok) {
        this.installing = false;
        this.error = galleryErrorText(response);
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

.summary {
  display: flex;
  flex: 1;
  align-items: center;
  gap: 12px;
  min-width: 0;
  padding-left: 2px;
}

.details {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
  max-width: 300px;
}

.name {
  @include truncate;

  align-self: flex-start;
  max-width: 100%;
  text-decoration: none;

  @include focus-ring;
}

.status {
  @include truncate;
}

.divider {
  flex: none;
  align-self: stretch;
  width: 1px;
  margin: 4px;
  background: var(--panel-border);
}

.compare {
  touch-action: none;
  user-select: none;
}

.preview .compare.held,
.preview .compare.held:hover:not(:disabled) {
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 16%, transparent);
  color: var(--accent);
}

.close {
  color: var(--icon-color);
}

.error {
  flex-basis: 100%;
  padding: 0 2px;
  color: var(--danger);
}

@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
}
</style>
