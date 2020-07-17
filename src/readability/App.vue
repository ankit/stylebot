<template>
  <div class="stylebot-reader" v-if="article">
    <div class="stylebot-reader-body">
      <a :href="url" class="stylebot-reader-domain">
        {{ urlLabel }}
      </a>

      <div class="stylebot-reader-header">
        <h1>{{ article.title }}</h1>
      </div>

      <div class="stylebot-reader-byline">{{ article.byline }}</div>
      <div class="stylebot-reader-content" v-html="article.content" />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'App',

  props: {
    url: {
      type: String,
      required: true,
    },

    urlLabel: {
      type: String,
      required: true,
    },

    article: {
      type: Object,
      required: true,
    },
  },

  mounted(): void {
    this.$el.querySelector('a').focus();
    document.getElementById('stylebot-reader-loading')?.remove();
  },
});
</script>
