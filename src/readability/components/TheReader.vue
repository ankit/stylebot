<template>
  <div
    v-if="font"
    :class="`stylebot-reader ${theme}`"
    :style="`font-family: ${font}; font-size: ${size}px; line-height: ${lineHeight}em`"
  >
    <div class="stylebot-reader-body" :style="`max-width: ${width}em`">
      <the-reader-header
        :url="url"
        :source="source"
        :title="article.title"
        :byline="article.byline"
      />

      <!-- eslint-disable vue/no-v-html - html is generated with the readability project -->
      <div class="stylebot-reader-content" v-html="article.content" />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import TheReaderHeader from './TheReaderHeader.vue';

import { addGoogleWebFont, injectCSSIntoDocument } from '@stylebot/css';
import {
  GetReadabilitySettings,
  GetReadabilitySettingsResponse,
  UpdateReader,
  ReadabilityTheme,
} from '@stylebot/types';

export default Vue.extend({
  name: 'TheReader',

  components: {
    TheReaderHeader,
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
  } {
    return {
      size: 16,
      font: '',
      width: 36,
      theme: 'light',
      lineHeight: 1.6,
    };
  },

  async mounted(): Promise<void> {
    const settings = await this.getReadabilitySettings();
    await this.injectFont(settings.font);

    this.font = settings.font;
    this.size = settings.size;
    this.theme = settings.theme;
    this.width = settings.width;
    this.lineHeight = settings.lineHeight;

    chrome.runtime.onMessage.addListener((message: UpdateReader) => {
      if (message.name === 'UpdateReader') {
        this.size = message.value.size;
        this.font = message.value.font;
        this.theme = message.value.theme;
        this.width = message.value.width;
        this.lineHeight = message.value.lineHeight;

        this.injectFont(this.font);
      }
    });
  },

  methods: {
    async injectFont(font: string) {
      const css = await addGoogleWebFont(font, '');
      injectCSSIntoDocument(css, 'reader-font');
    },

    async getReadabilitySettings(): Promise<GetReadabilitySettingsResponse> {
      const message: GetReadabilitySettings = {
        name: 'GetReadabilitySettings',
      };

      return new Promise(resolve => {
        chrome.runtime.sendMessage(
          message,
          (response: GetReadabilitySettingsResponse) => {
            resolve(response);
          }
        );
      });
    },
  },
});
</script>
