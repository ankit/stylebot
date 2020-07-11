<template>
  <div>
    <font-family class="mt=3" />
    <font-size class="mt-3" />
    <font-weight class="mt-3" />
    <font-style class="mt-3" />
    <font-variant class="mt-3" />
    <text-decoration class="mt-3" />
    <text-transform class="mt-3" />
    <text-align class="mt-3" />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import FontSize from './text/FontSize.vue';
import FontWeight from './text/FontWeight.vue';
import FontStyle from './text/FontStyle.vue';
import FontFamily from './text/FontFamily.vue';
import FontVariant from './text/FontVariant.vue';
import TextDecoration from './text/TextDecoration.vue';
import TextTransform from './text/TextTransform.vue';
import TextAlign from './text/TextAlign.vue';

export default Vue.extend({
  name: 'TheTextProperties',
  components: {
    FontFamily,
    FontSize,
    FontWeight,
    FontStyle,
    FontVariant,
    TextDecoration,
    TextTransform,
    TextAlign,
  },
});
</script>
