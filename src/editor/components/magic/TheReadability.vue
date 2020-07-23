<template>
  <div class="the-readability">
    <b-form-checkbox v-model="value" switch>Enable Readability</b-form-checkbox>

    <p class="lead pt-2">
      Make articles on this site readable by hiding non-essential page elements
      like sidebars, footers and ads.
    </p>

    <b-row align-content="center" no-gutters>
      <b-col cols="7" class="mr-3">
        <the-readability-font-family />
      </b-col>

      <b-col cols="4" class="mr-1">
        <the-readability-font-size />
      </b-col>
    </b-row>

    <b-row align-content="center" no-gutters class="mt-3">
      <b-col cols="5" class="mr-2">
        <the-readability-theme />
      </b-col>

      <b-col cols="3">
        <the-readability-width />
      </b-col>
    </b-row>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import TheReadabilityWidth from './readability/TheReadabilityWidth.vue';
import TheReadabilityTheme from './readability/TheReadabilityTheme.vue';
import TheReadabilityFontSize from './readability/TheReadabilityFontSize.vue';
import TheReadabilityFontFamily from './readability/TheReadabilityFontFamily.vue';

export default Vue.extend({
  name: 'TheReadability',

  components: {
    TheReadabilityWidth,
    TheReadabilityTheme,
    TheReadabilityFontSize,
    TheReadabilityFontFamily,
  },

  computed: {
    value: {
      get(): boolean {
        return this.$store.state.readability;
      },

      set(value: boolean): void {
        this.$store.dispatch('applyReadability', value);
      },
    },
  },
});
</script>

<style lang="scss" scoped>
.the-readability {
  line-height: 21px;
}
</style>
