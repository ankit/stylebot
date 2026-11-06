<template>
  <s-theme-provider class="root" :mode="appearance">
    <div
      ref="card"
      class="preview"
      :class="{ leaving }"
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
        :style-data="shownStyle"
        :installing="installing"
        :switching="switching"
        :options="options"
        :values="pickedValues"
        @compare="handlers.compare"
        @option="pickOption"
        @install="install"
        @filled="filled = true"
        @cancel="cancel"
      />

      <s-text v-if="error" as="p" size="caption" class="error" role="alert">
        {{ error }}
      </s-text>

      <preview-style-switcher
        v-if="phase !== 'done' && siteStyles.length > 1"
        :index="position"
        :total="siteStyles.length"
        :disabled="installing"
        @switch="switchStyle"
      />
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
import type {
  GalleryStyle,
  StyleOptionDeclarations,
  StyleOptionValues,
  StylebotAppearance,
} from '@stylebot/types';

import InstallConfirmation from './InstallConfirmation.vue';
import PreviewControls from './PreviewControls.vue';
import PreviewStyleSwitcher from './PreviewStyleSwitcher.vue';
import { isTyping } from '../keys';

type Phase = 'preview' | 'installing' | 'done';

const CONFIRM_MS = 4000;
const CONFIRM_AFTER_HOVER_MS = 2000;

/**
 * The card a page shows while it previews a gallery style, to try its options,
 * compare it with the page's own styles, move to the site's other styles,
 * install it, or cancel (or press Esc).
 * Once installed it confirms it, with an undo, then emits `done`.
 */
export default Vue.extend({
  name: 'GalleryPreview',

  components: {
    InstallConfirmation,
    PreviewControls,
    PreviewStyleSwitcher,
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

    // The options the style declares, if any, and the values first shown.
    options: {
      type: Object as PropType<StyleOptionDeclarations | undefined>,
      default: undefined,
    },

    values: {
      type: Object as PropType<StyleOptionValues>,
      default: () => ({}),
    },
  },

  data() {
    return {
      phase: 'preview' as Phase,
      filled: false,
      undoing: false,
      leaving: false,
      error: '',
      timer: 0,
      pickedValues: { ...this.values } as StyleOptionValues,
      siteStyles: [] as Array<GalleryStyle>,
      // The style moved to, until the page shows it.
      nextId: null as number | null,
      // Where the card was when clicked Install, until the cursor leaves it.
      installArea: null as DOMRect | null,
    };
  },

  computed: {
    installing(): boolean {
      return this.phase === 'installing';
    },

    switching(): boolean {
      return this.nextId !== null;
    },

    shownStyle(): GalleryStyle {
      return (
        this.siteStyles.find(style => style.id === this.nextId) ??
        this.styleData
      );
    },

    position(): number {
      return this.siteStyles.findIndex(({ id }) => id === this.shownStyle.id);
    },

    // Installed from the card, once its button has filled; from the popup, at once.
    confirmable(): boolean {
      return this.installed && (this.filled || !this.installing);
    },
  },

  watch: {
    styleData(style: GalleryStyle): void {
      this.pickedValues = { ...this.values };
      this.listShown(this.siteStyles);

      if (this.nextId === style.id) {
        this.nextId = null;
      }
    },

    confirmable(confirmable: boolean): void {
      if (confirmable) {
        this.confirm();
      }
    },
  },

  async mounted() {
    window.addEventListener('keydown', this.onKeydown);

    const styles = await this.handlers.getSiteStyles();

    this.listShown(styles);
  },

  beforeDestroy() {
    window.removeEventListener('keydown', this.onKeydown);
    window.removeEventListener('mousemove', this.onMoveAfterInstall, true);
    clearTimeout(this.timer);
  },

  methods: {
    /**
     * Keeps the site's styles, with the one showing among them.
     */
    listShown(styles: Array<GalleryStyle>): void {
      const { styleData } = this;

      this.siteStyles = styles.some(({ id }) => id === styleData.id)
        ? styles
        : [styleData, ...styles];
    },

    async switchStyle(position: number): Promise<void> {
      const { id } = this.siteStyles[position];

      this.error = '';
      this.nextId = id;

      const response = await this.handlers.preview(id);

      if (!response.ok && this.nextId === id) {
        this.nextId = null;
        this.error = galleryErrorText(response);
      }
    },

    pickOption(option: string, value: string): void {
      this.pickedValues = { ...this.pickedValues, [option]: value };
      this.handlers.setOption(option, value);
    },

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

    async install({ detail }: MouseEvent): Promise<void> {
      const card = this.$refs.card as HTMLElement;

      this.error = '';
      this.filled = false;
      this.installArea = detail ? card.getBoundingClientRect() : null;
      this.phase = 'installing';

      const response = await this.handlers.install();

      // A successful install ends the preview, which sets `installed`.
      if (!response.ok) {
        this.phase = 'preview';
        this.error = galleryErrorText(response);
      }
    },

    /**
     * Shows the install. The card shrinks as it does, maybe out from under the
     * cursor that clicked Install, so it waits for that cursor to leave the
     * space the card took up.
     */
    confirm(): void {
      this.phase = 'done';

      if (this.installArea) {
        window.addEventListener('mousemove', this.onMoveAfterInstall, true);
      } else {
        this.resume(CONFIRM_MS);
      }
    },

    onMoveAfterInstall({ clientX, clientY }: MouseEvent): void {
      const { left, right, top, bottom } = this.installArea as DOMRect;
      const inside =
        clientX >= left &&
        clientX <= right &&
        clientY >= top &&
        clientY <= bottom;

      if (!inside) {
        window.removeEventListener('mousemove', this.onMoveAfterInstall, true);
        this.installArea = null;
        this.resume(CONFIRM_AFTER_HOVER_MS);
      }
    },

    pause(): void {
      clearTimeout(this.timer);
    },

    onMouseLeave(): void {
      if (!this.installArea) {
        this.resume(CONFIRM_AFTER_HOVER_MS);
      }
    },

    resume(ms: number): void {
      clearTimeout(this.timer);

      if (this.phase === 'done' && !this.undoing) {
        this.timer = window.setTimeout(this.dismissUnlessHovered, ms);
      }
    },

    /**
     * Checked as the time runs out, since a card that changes under a still
     * cursor gets no mouseenter. Leaving it starts the time again.
     */
    dismissUnlessHovered(): void {
      const card = this.$refs.card as HTMLElement;

      if (!card.matches(':hover')) {
        this.dismiss();
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
  width: 340px;
  max-width: calc(100vw - 40px);
  background: none;
}

.preview {
  box-sizing: border-box;
  border: 1px solid var(--field-border);
  border-radius: 16px;
  background: var(--panel-surface);
  box-shadow: 0 16px 48px rgb(0 0 0 / 34%), 0 2px 6px rgb(0 0 0 / 20%);
  pointer-events: auto;
  animation: rise 220ms cubic-bezier(0.2, 0.8, 0.2, 1);

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
}

.preview.leaving {
  animation: leave 260ms ease-in forwards;

  @media (prefers-reduced-motion: reduce) {
    animation-name: fade;
  }
}

.error {
  padding: 0 16px 12px;
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
    transform: translateY(10px);
  }
}
</style>
