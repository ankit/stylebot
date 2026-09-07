<template>
  <div
    v-if="font"
    tabindex="-1"
    :class="[`stylebot-reader ${theme}`, { revealed }]"
    :style="`font-family: ${font}; font-size: ${size}px; line-height: ${lineHeight}em`"
  >
    <the-reader-dock
      :theme="theme"
      :font="font"
      :size="size"
      :width="width"
      :justify="justify"
      :line-height="lineHeight"
      @update="onUpdateSettings"
    />

    <div class="stylebot-reader-body" :style="`max-width: ${width}em`">
      <the-reader-header
        :url="url"
        :source="source"
        :title="article.title"
        :byline="article.byline"
        :published="article.published"
      />

      <!-- eslint-disable vue/no-v-html - html is generated with the readability project -->
      <div
        class="stylebot-reader-content"
        :class="{ justify }"
        v-html="article.content"
      />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import { defaultReadabilitySettings } from '@stylebot/settings';
import {
  addGoogleWebFont,
  getCssWithExpandedImports,
  injectCSSIntoDocument,
} from '@stylebot/css';

import { hideLoader, cacheTheme } from '../loader';
import { sendReadabilitySettings } from '../dock-actions';

import {
  GetReadabilitySettings,
  GetReadabilitySettingsResponse,
  ReadabilitySettings,
  UpdateReader,
  ReadabilityTheme,
} from '@stylebot/types';

import TheReaderHeader from './TheReaderHeader.vue';
import TheReaderDock from './dock/TheReaderDock.vue';

export default Vue.extend({
  name: 'TheReader',

  components: {
    TheReaderHeader,
    TheReaderDock,
  },

  props: {
    url: {
      type: String,
      required: true,
    },

    source: {
      type: String,
      required: true,
    },

    article: {
      type: Object,
      required: true,
    },
  },

  data(): {
    size: number;
    font: string;
    width: number;
    lineHeight: number;
    theme: ReadabilityTheme;
    justify: boolean;
    revealed: boolean;
  } {
    return { ...defaultReadabilitySettings, revealed: false };
  },

  async mounted(): Promise<void> {
    try {
      const settings = await this.getReadabilitySettings();

      this.font = settings.font;
      this.size = settings.size;
      this.theme = settings.theme;
      this.width = settings.width;
      this.lineHeight = settings.lineHeight;
      this.justify = settings.justify;

      cacheTheme(settings.theme);

      // Bounded so a slow/broken font fetch can't stall the reveal for long.
      await Promise.race([
        this.injectFont(settings.font),
        new Promise(resolve => setTimeout(resolve, 1500)),
      ]);
    } finally {
      // Always reveal the reader — the original page is already gone,
      // so a stalled/failed fetch here would otherwise blank the page.
      hideLoader();

      // The reader was just unhidden and never painted — force a reflow so
      // the pre-fade style commits before we transition it.
      void (this.$el as HTMLElement).offsetHeight;
      this.revealed = true;

      // Focus the scrollable panel itself so arrow/space/Page Up/Down/Home/
      // End scroll it, instead of going to the (now-hidden) original page.
      (this.$el as HTMLElement).focus();
    }

    chrome.runtime.onMessage.addListener((message: UpdateReader) => {
      if (message.name === 'UpdateReader') {
        this.size = message.value.size;
        this.font = message.value.font;
        this.theme = message.value.theme;
        this.width = message.value.width;
        this.lineHeight = message.value.lineHeight;
        this.justify = message.value.justify;

        cacheTheme(message.value.theme);
        this.injectFont(this.font);
      }
    });
  },

  methods: {
    onUpdateSettings(value: ReadabilitySettings): void {
      this.size = value.size;
      this.font = value.font;
      this.theme = value.theme;
      this.width = value.width;
      this.lineHeight = value.lineHeight;
      this.justify = value.justify;

      cacheTheme(value.theme);
      this.injectFont(value.font);
      sendReadabilitySettings(value);
    },

    async injectFont(font: string): Promise<void> {
      const css = await addGoogleWebFont(font, '');
      const expandedCss = await getCssWithExpandedImports(css);

      await injectCSSIntoDocument(expandedCss, 'reader-font');

      // The reader is still hidden, so the browser won't fetch this font on
      // its own — request it explicitly instead of using `fonts.ready`.
      if (document.fonts) {
        try {
          await document.fonts.load(`16px "${font}"`);
        } catch {
          // font failed to load — reveal with whatever fallback is active
        }
      }
    },

    async getReadabilitySettings(): Promise<GetReadabilitySettingsResponse> {
      const message: GetReadabilitySettings = {
        name: 'GetReadabilitySettings',
      };

      const response = new Promise<GetReadabilitySettingsResponse>(resolve => {
        chrome.runtime.sendMessage(
          message,
          (response: GetReadabilitySettingsResponse) => {
            resolve(response);
          }
        );
      });

      // Falls back to defaults if the service worker never responds.
      const timeout = new Promise<GetReadabilitySettingsResponse>(resolve => {
        setTimeout(() => resolve(defaultReadabilitySettings), 1000);
      });

      return Promise.race([response, timeout]);
    },
  },
});
</script>
