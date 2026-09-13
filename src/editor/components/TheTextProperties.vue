<template>
  <div>
    <font-family />
    <font-size />
    <line-height />
    <font-style />
    <text-decoration />
    <text-transform />
    <text-align />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import FontSize from './text/FontSize.vue';
import LineHeight from './text/LineHeight.vue';
import FontStyle from './text/FontStyle.vue';
import FontFamily from './text/FontFamily.vue';
import TextDecoration from './text/TextDecoration.vue';
import TextTransform from './text/TextTransform.vue';
import TextAlign from './text/TextAlign.vue';

export default Vue.extend({
  name: 'TheTextProperties',
  components: {
    FontFamily,
    FontSize,
    LineHeight,
    FontStyle,
    TextDecoration,
    TextTransform,
    TextAlign,
  },
});
</script>
