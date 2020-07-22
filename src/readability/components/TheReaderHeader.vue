<template>
  <div class="stylebot-reader-header">
    <a :href="url" class="stylebot-reader-domain">
      {{ source }}
    </a>

    <h1>{{ title }}</h1>
    <div class="stylebot-reader-byline">{{ byline }}</div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'TheReaderHeader',

  props: {
    title: {
      type: String,
      required: true,
    },

    byline: {
      type: String,
      required: true,
    },

    url: {
      type: String,
      required: true,
    },

    source: {
      type: String,
      required: true,
    },
  },
});
</script>

<style lang="scss" scoped>
.stylebot-reader-header {
  > h1 {
    font-size: 1.6em;
    line-height: 1.25em;
    width: 100%;
    margin-top: 30px;
    margin-bottom: 10px;
    padding: 0;
  }
}

.stylebot-reader-domain {
  font-size: 0.9em;
  line-height: 1.48em;
  padding-bottom: 4px;
  text-decoration: none;
  border-bottom: 1px solid #333;
  color: #45a1ff;
}

.stylebot-reader-byline {
  font-size: 1em;
  font-weight: 300;
  margin-bottom: 30px;
}
</style>
