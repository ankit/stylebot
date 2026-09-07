<template>
  <div class="stylebot-reader-dock" :style="{ opacity: dockOpacity }">
    <div class="stylebot-reader-dock-buttons">
      <button
        class="stylebot-reader-dock-btn"
        @click="close"
        @mouseenter="showTip($event, closeTipText)"
        @mouseleave="hideTip"
      >
        <icon-close />
      </button>

      <button
        class="stylebot-reader-dock-btn stylebot-reader-dock-aa"
        :class="{ active: open }"
        @click="toggleSettings"
        @mouseenter="showTip($event, 'Reading settings')"
        @mouseleave="hideTip"
      >
        Aa
      </button>

      <button
        class="stylebot-reader-dock-btn stylebot-reader-dock-more-btn"
        :class="{ active: moreOpen }"
        @click="toggleMore"
      >
        &#8942;
      </button>
    </div>

    <div v-if="open" class="stylebot-reader-dock-panel">
      <div class="stylebot-reader-dock-swatches">
        <button
          v-for="t in themeList"
          :key="t.value"
          class="stylebot-reader-dock-swatch"
          :class="{ selected: t.value === theme }"
          :style="{ background: t.bg }"
          @click="pickTheme(t.value)"
        />
      </div>

      <div class="stylebot-reader-dock-fonts">
        <button
          v-for="f in fontList"
          :key="f"
          class="stylebot-reader-dock-font"
          :class="{ selected: f === font }"
          :style="{ fontFamily: f }"
          @click="pickFont(f)"
        >
          {{ f }}
        </button>
      </div>

      <div class="stylebot-reader-dock-segmented">
        <button :disabled="sizeIndex === 0" @click="sizeDown">
          <span style="font: 400 11px/1 system-ui">A</span>
        </button>
        <button :disabled="sizeIndex === SIZES.length - 1" @click="sizeUp">
          <span style="font: 400 17px/1 system-ui">A</span>
        </button>
      </div>

      <div class="stylebot-reader-dock-segmented">
        <button :disabled="widthIndex === 0" @click="widthDown">
          <span style="font: 400 12px/1 system-ui">&rarr;&larr;</span>
        </button>
        <button :disabled="widthIndex === WIDTHS.length - 1" @click="widthUp">
          <span style="font: 400 12px/1 system-ui; display: inline-block; transform: scaleX(2.1)">&harr;</span>
        </button>
      </div>

      <div class="stylebot-reader-dock-segmented">
        <button
          class="stylebot-reader-dock-align"
          :class="{ active: !justify }"
          @click="pickJustify(false)"
        >
          <icon-align-left />
        </button>
        <button
          class="stylebot-reader-dock-align"
          :class="{ active: justify }"
          @click="pickJustify(true)"
        >
          <icon-align-justify />
        </button>
      </div>

      <div class="stylebot-reader-dock-reset-row">
        <button class="stylebot-reader-dock-reset" @click="reset">Reset</button>
      </div>
    </div>

    <div v-else-if="moreOpen" class="stylebot-reader-dock-panel stylebot-reader-dock-more">
      <button class="stylebot-reader-dock-more-item" @click="openOptions">
        <icon-options />
        Options
      </button>
      <button class="stylebot-reader-dock-more-item" @click="reportIssue">
        <icon-flag />
        Report an issue
      </button>
      <button class="stylebot-reader-dock-more-item" @click="donate">
        <icon-coffee />
        Donate
      </button>
    </div>

    <div
      v-if="tip"
      class="stylebot-reader-dock-tooltip"
      :style="{ top: tipTop + 'px', left: tipLeft + 'px' }"
    >
      {{ tip }}
    </div>
  </div>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue';

import { defaultReadabilitySettings } from '@stylebot/settings';
import { readabilityFonts, SIZES, WIDTHS, nearestStepIndex } from '@stylebot/readability';
import {
  addGoogleWebFont,
  getCssWithExpandedImports,
  injectCSSIntoDocument,
} from '@stylebot/css';
import { ReadabilitySettings, ReadabilityTheme } from '@stylebot/types';

import {
  closeReader,
  openOptionsPage,
  openReportIssuePage,
  openDonatePage,
} from '../dock-actions';
import { THEME_BACKGROUNDS } from '../theme-colors';

import IconClose from '../icons/IconClose.vue';
import IconAlignLeft from '../icons/IconAlignLeft.vue';
import IconAlignJustify from '../icons/IconAlignJustify.vue';
import IconOptions from '../icons/IconOptions.vue';
import IconFlag from '../icons/IconFlag.vue';
import IconCoffee from '../icons/IconCoffee.vue';

// Icons stay lit while the pointer is within this many px of the dock.
const WAKE_RADIUS = 220;
const IDLE_DELAY_MS = 2600;

export default Vue.extend({
  name: 'TheReaderDock',

  components: {
    IconClose,
    IconAlignLeft,
    IconAlignJustify,
    IconOptions,
    IconFlag,
    IconCoffee,
  },

  props: {
    theme: { type: String as PropType<ReadabilityTheme>, required: true },
    font: { type: String, required: true },
    size: { type: Number, required: true },
    width: { type: Number, required: true },
    justify: { type: Boolean, required: true },
    lineHeight: { type: Number, required: true },
  },

  data(): {
    open: boolean;
    moreOpen: boolean;
    idle: boolean;
    tip: string;
    tipTop: number;
    tipLeft: number;
    idleTimeout: ReturnType<typeof setTimeout> | null;
    fontsPreloaded: boolean;
  } {
    return {
      open: false,
      moreOpen: false,
      idle: false,
      tip: '',
      tipTop: 0,
      tipLeft: 0,
      idleTimeout: null,
      fontsPreloaded: false,
    };
  },

  computed: {
    SIZES: () => SIZES,
    WIDTHS: () => WIDTHS,

    fontList: () => readabilityFonts,

    themeList(): Array<{ value: ReadabilityTheme; label: string; bg: string }> {
      return [
        { value: 'light', label: 'Light', bg: THEME_BACKGROUNDS.light },
        { value: 'sepia', label: 'Sepia', bg: THEME_BACKGROUNDS.sepia },
        { value: 'dark', label: 'Dark', bg: THEME_BACKGROUNDS.dark },
      ];
    },

    sizeIndex(): number {
      return nearestStepIndex(SIZES, this.size);
    },

    widthIndex(): number {
      return nearestStepIndex(WIDTHS, this.width);
    },

    anyPanelOpen(): boolean {
      return this.open || this.moreOpen;
    },

    dockOpacity(): number {
      return this.idle && !this.anyPanelOpen ? 0.45 : 1;
    },

    closeTipText(): string {
      return `Turn off readability for ${document.domain}`;
    },
  },

  watch: {
    open(isOpen: boolean): void {
      // The list renders every font in its own face, not just the active one
      // — load them all the first time it's actually opened, not upfront.
      if (isOpen && !this.fontsPreloaded) {
        this.fontsPreloaded = true;
        this.preloadFonts();
      }
    },

    anyPanelOpen(isOpen: boolean): void {
      // Only listen while a panel is open, so a closed dock costs nothing.
      if (isOpen) {
        document.addEventListener('click', this.onDocumentClick);
      } else {
        document.removeEventListener('click', this.onDocumentClick);
      }
    },
  },

  mounted() {
    this.wake();
    window.addEventListener('mousemove', this.wake, { passive: true });
    window.addEventListener('scroll', this.wake, { passive: true });
    window.addEventListener('touchstart', this.wake, { passive: true });
  },

  beforeDestroy() {
    window.removeEventListener('mousemove', this.wake);
    window.removeEventListener('scroll', this.wake);
    window.removeEventListener('touchstart', this.wake);
    document.removeEventListener('click', this.onDocumentClick);
    clearTimeout(this.idleTimeout);
  },

  methods: {
    // event.target gets retargeted to the shadow host outside it — use
    // composedPath() to test containment reliably across that boundary.
    onDocumentClick(event: MouseEvent): void {
      if (!event.composedPath().includes(this.$el)) {
        this.open = false;
        this.moreOpen = false;
      }
    },

    // Proximity: icons stay lit while the pointer is near the top-right dock,
    // and fade after IDLE_DELAY_MS of inactivity once it's out of reach.
    wake(event?: MouseEvent): void {
      let near = true;

      if (event && event.type === 'mousemove') {
        const dx = Math.max(0, window.innerWidth - 60 - event.clientX);
        const dy = Math.max(0, event.clientY - 40);
        near = Math.sqrt(dx * dx + dy * dy) < WAKE_RADIUS;
      }

      if (near) {
        if (this.idle) {
          this.idle = false;
        }
        clearTimeout(this.idleTimeout);
        this.idleTimeout = setTimeout(() => {
          if (!this.anyPanelOpen) {
            this.idle = true;
          }
        }, IDLE_DELAY_MS);
      } else if (!this.idle && !this.anyPanelOpen) {
        clearTimeout(this.idleTimeout);
        this.idle = true;
      }
    },

    async preloadFonts(): Promise<void> {
      readabilityFonts.forEach(async font => {
        // No-op for non-Google-hosted names (e.g. Georgia, Helvetica) —
        // addGoogleWebFont resolves with the input CSS unchanged on a 400.
        const css = await addGoogleWebFont(font, '');
        const expandedCss = await getCssWithExpandedImports(css);
        await injectCSSIntoDocument(expandedCss, `reader-font-preview-${font}`);
      });
    },

    showTip(event: MouseEvent, text: string): void {
      if (this.anyPanelOpen) {
        return;
      }

      const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
      this.tip = text;
      this.tipTop = Math.round(rect.bottom + 8);
      this.tipLeft = Math.round(rect.left + rect.width / 2);
    },

    hideTip(): void {
      this.tip = '';
    },

    close(): void {
      closeReader();
    },

    toggleSettings(): void {
      this.moreOpen = false;
      this.open = !this.open;
      this.hideTip();
    },

    toggleMore(): void {
      this.open = false;
      this.moreOpen = !this.moreOpen;
      this.hideTip();
    },

    openOptions(): void {
      this.moreOpen = false;
      openOptionsPage();
    },

    reportIssue(): void {
      this.moreOpen = false;
      openReportIssuePage();
    },

    donate(): void {
      this.moreOpen = false;
      openDonatePage();
    },

    emitUpdate(patch: Partial<ReadabilitySettings>): void {
      const value: ReadabilitySettings = {
        theme: this.theme,
        font: this.font,
        size: this.size,
        width: this.width,
        justify: this.justify,
        lineHeight: this.lineHeight,
        ...patch,
      };
      this.$emit('update', value);
    },

    pickTheme(theme: ReadabilityTheme): void {
      this.emitUpdate({ theme });
    },

    pickFont(font: string): void {
      this.emitUpdate({ font });
    },

    pickJustify(justify: boolean): void {
      this.emitUpdate({ justify });
    },

    sizeDown(): void {
      this.emitUpdate({ size: SIZES[Math.max(0, this.sizeIndex - 1)] });
    },

    sizeUp(): void {
      this.emitUpdate({ size: SIZES[Math.min(SIZES.length - 1, this.sizeIndex + 1)] });
    },

    widthDown(): void {
      this.emitUpdate({ width: WIDTHS[Math.max(0, this.widthIndex - 1)] });
    },

    widthUp(): void {
      this.emitUpdate({ width: WIDTHS[Math.min(WIDTHS.length - 1, this.widthIndex + 1)] });
    },

    reset(): void {
      const { theme, font, size, width, justify, lineHeight } = defaultReadabilitySettings;
      this.emitUpdate({ theme, font, size, width, justify, lineHeight });
    },
  },
});
</script>

<style lang="scss" scoped>
.stylebot-reader-dock {
  position: fixed;
  top: 18px;
  right: 22px;
  z-index: 40;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Ubuntu,
    'Helvetica Neue', sans-serif;
  transition: opacity 0.32s ease;
}

.stylebot-reader-dock-buttons {
  display: flex;
  gap: 4px;
}

.stylebot-reader-dock-btn {
  all: unset;
  box-sizing: border-box;
  width: 38px;
  height: 38px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--muted-foreground);
  transition: color 0.18s ease, background-color 0.18s ease;

  &:hover {
    background: color-mix(in srgb, var(--main-foreground) 6%, transparent);
    color: var(--main-foreground);
  }
}

.stylebot-reader-dock-aa {
  font: 500 15px/1 system-ui, -apple-system, sans-serif;

  &.active {
    background: color-mix(in srgb, var(--main-foreground) 6%, transparent);
    color: var(--main-foreground);
  }
}

.stylebot-reader-dock-more-btn {
  font: 700 18px/1 system-ui, -apple-system, sans-serif;

  &.active {
    background: color-mix(in srgb, var(--main-foreground) 6%, transparent);
    color: var(--main-foreground);
  }
}

.stylebot-reader-dock-panel {
  width: 176px;
  max-height: calc(100vh - 92px);
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 12px;
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  background: var(--main-background);
  border: 1px solid var(--border-color);
  color: var(--main-foreground);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.14);
  animation: stylebot-reader-dock-in 0.16s ease-out;
}

@keyframes stylebot-reader-dock-in {
  from {
    opacity: 0;
    transform: translateY(-6px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

.stylebot-reader-dock-swatches {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
}

.stylebot-reader-dock-swatch {
  all: unset;
  box-sizing: border-box;
  height: 24px;
  border-radius: 7px;
  cursor: pointer;
  border: 1px solid var(--border-color);

  &.selected {
    border: 2px solid var(--link-color);
  }
}

.stylebot-reader-dock-fonts {
  border-radius: 9px;
  overflow: hidden;
  border: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
}

.stylebot-reader-dock-font {
  all: unset;
  box-sizing: border-box;
  padding: 7px 8px;
  font-size: 14px;
  text-align: center;
  cursor: pointer;
  color: var(--main-foreground);

  & + & {
    border-top: 1px solid var(--border-color);
  }

  &.selected {
    background: color-mix(in srgb, var(--main-foreground) 6%, transparent);
    color: var(--link-color);
  }
}

.stylebot-reader-dock-segmented {
  display: grid;
  grid-template-columns: 1fr 1fr;
  border-radius: 9px;
  overflow: hidden;
  border: 1px solid var(--border-color);

  > button {
    all: unset;
    box-sizing: border-box;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--main-foreground);

    &:first-child {
      border-right: 1px solid var(--border-color);
    }

    &:disabled {
      cursor: default;
      opacity: 0.35;
    }

    &:not(:disabled):hover {
      background: color-mix(in srgb, var(--main-foreground) 5%, transparent);
    }
  }
}

.stylebot-reader-dock-align.active {
  background: color-mix(in srgb, var(--main-foreground) 6%, transparent);
  color: var(--link-color);
}

.stylebot-reader-dock-reset-row {
  display: flex;
  justify-content: flex-end;
  padding-top: 2px;
}

.stylebot-reader-dock-reset {
  all: unset;
  font: 400 11px/1.2 system-ui, -apple-system, sans-serif;
  cursor: pointer;
  text-decoration: underline;
  color: var(--muted-foreground);
}

.stylebot-reader-dock-more {
  width: 148px;
  padding: 4px;
  border-radius: 11px;
  gap: 1px;
}

.stylebot-reader-dock-more-item {
  all: unset;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 3px 7px;
  border-radius: 7px;
  font-size: 13px;
  cursor: pointer;
  color: var(--main-foreground);

  &:hover {
    background: color-mix(in srgb, var(--main-foreground) 6%, transparent);
  }

  svg {
    flex-shrink: 0;
    width: 14px;
    height: 14px;
    color: var(--muted-foreground);
  }
}

.stylebot-reader-dock-tooltip {
  position: fixed;
  transform: translateX(-50%);
  z-index: 70;
  pointer-events: none;
  white-space: nowrap;
  padding: 4px 7px;
  border-radius: 6px;
  background: var(--main-background);
  color: var(--main-foreground);
  border: 1px solid var(--border-color);
  font: 400 11.5px/1.2 system-ui, -apple-system, sans-serif;
  box-shadow: 0 5px 14px rgba(0, 0, 0, 0.14);
}
</style>
