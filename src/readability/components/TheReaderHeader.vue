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
      required: false,
      default: '',
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
    line-height: 1.3em;
    font-weight: 700;
    width: 100%;
    margin-top: 24px;
    margin-bottom: 10px;
    padding: 0;
  }
}

.stylebot-reader-domain {
  display: inline-block;
  font-size: 0.85em;
  line-height: 1.4em;
  padding-bottom: 4px;
  text-decoration: none;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--muted-foreground);
  border-bottom: 1px solid var(--border-color);
  transition: color 0.15s ease, border-color 0.15s ease;

  &:hover {
    color: var(--link-color);
    border-color: var(--link-color);
  }
}

.stylebot-reader-byline {
  font-size: 1em;
  font-weight: 300;
  color: var(--muted-foreground);
  margin-bottom: 30px;
}
</style>
