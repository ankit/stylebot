<template>
  <div class="stylebot-reader" v-if="article">
    <div class="content">
      <a :href="href" class="domain">
        {{ article.siteName }}
      </a>

      <div class="header">
        <h1>{{ article.title }}</h1>
      </div>

      <div class="byline">{{ article.byline }}</div>

      <div v-html="article.content" />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import Readability from 'readability';

export default Vue.extend({
  name: 'App',

  data(): any {
    const url = window.location.href;
    const parts = url.split('/');
    const href = `${parts[0]}//${parts[2]}`;

    return {
      article: null,
      href,
    };
  },

  created(): void {
    const documentClone = document.cloneNode(true);
    this.article = new Readability(documentClone).parse();
  },
});
</script>
