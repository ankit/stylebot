<template>
  <span class="s-code-text">
    <template v-for="(part, index) in parts">
      <code v-if="part.match" :key="index" class="code" v-text="part.text" />
      <!-- Bare text, not a span, so the space before the code stays in an accessible name. -->
      <template v-else>{{ part.text }}</template>
    </template>
  </span>
</template>

<script lang="ts">
import Vue from 'vue';
import { splitAround } from '@stylebot/utils';
import type { TextPart } from '@stylebot/utils';

export default Vue.extend({
  name: 'SCodeText',

  props: {
    text: {
      type: String,
      required: true,
    },
    // The part of text to set in mono, such as a selector or a CSS keyword.
    code: {
      type: String,
      required: true,
    },
  },

  computed: {
    parts(): Array<TextPart> {
      return splitAround(this.text, this.code);
    },
  },
});
</script>

<style lang="scss" scoped>
.code {
  font-family: var(--font-mono);
}
</style>
