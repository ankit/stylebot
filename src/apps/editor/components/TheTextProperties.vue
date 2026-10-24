<template>
  <div>
    <font-family />
    <font-size />
    <font-weight />
    <line-height />
    <color />
    <text-decoration />
    <text-align />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import FontSize from './text/FontSize.vue';
import FontWeight from './text/FontWeight.vue';
import LineHeight from './text/LineHeight.vue';
import FontFamily from './text/FontFamily.vue';
import Color from './color/Color.vue';
import TextDecoration from './text/TextDecoration.vue';
import TextAlign from './text/TextAlign.vue';

export default Vue.extend({
  name: 'TheTextProperties',
  components: {
    FontFamily,
    FontSize,
    FontWeight,
    LineHeight,
    Color,
    TextDecoration,
    TextAlign,
  },
});
</script>
