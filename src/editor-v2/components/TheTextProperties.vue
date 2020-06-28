<template>
  <div>
    <font-size />

    <div style="margin-top: 20px">
      <font-weight />
    </div>

    <div style="margin-top: 20px">
      <font-style />
    </div>

    <div style="margin-top: 20px">
      <font-variant />
    </div>

    <div style="margin-top: 20px">
      <text-decoration />
    </div>

    <div style="margin-top: 20px">
      <text-transform />
    </div>

    <div style="margin-top: 20px">
      <text-align />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import FontSize from './text/FontSize.vue';
import FontWeight from './text/FontWeight.vue';
import FontStyle from './text/FontStyle.vue';
import FontVariant from './text/FontVariant.vue';
import TextDecoration from './text/TextDecoration.vue';
import TextTransform from './text/TextTransform.vue';
import TextAlign from './text/TextAlign.vue';

export default Vue.extend({
  name: 'TheTextProperties',
  components: {
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
