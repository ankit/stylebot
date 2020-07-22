<template>
  <div class="stylebot-reader">
    <div
      class="stylebot-reader-body"
      :style="`font-family: ${fontFamily}; font-size: ${fontSize};`"
    >
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

  computed: {
    fontSize(): string {
      return this.$store.state.readabilitySettings.fontSize;
    },

    fontFamily(): string {
      console.log(
        'this.$store.state.readabilitySettings.fontFamily',
        this.$store.state.readabilitySettings.fontFamily
      );
      return this.$store.state.readabilitySettings.fontFamily;
    },
  },

  mounted(): void {
    this.$el.querySelector('a')?.focus();
  },
});
</script>
