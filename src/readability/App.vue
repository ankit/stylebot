<template>
  <the-reader v-if="article" :article="article" :url="url" :source="source" />
</template>

<script lang="ts">
import Vue from 'vue';
import TheReader from './components/TheReader.vue';

import { hideLoader } from './loader';

export default Vue.extend({
  name: 'App',

  components: {
    TheReader,
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

  mounted(): void {
    hideLoader();
  },
});
</script>
