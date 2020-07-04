<template>
  <div>
    <visibility class="mt-3" />

    <margin class="mt-3" />
    <padding class="mt-3" />

    <width class="mt-3" />
    <height class="mt-3" />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import Width from './layout/Width.vue';
import Height from './layout/Height.vue';

import Margin from './layout/Margin.vue';
import Padding from './layout/Padding.vue';

import Visibility from './layout/Visibility.vue';

export default Vue.extend({
  name: 'TheLayoutProperties',

  components: {
    Width,
    Height,
    Margin,
    Padding,
    Visibility,
  },
});
</script>
