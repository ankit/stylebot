<template>
  <div class="the-readability">
    <b-form-checkbox v-model="value" switch>Enable Readability</b-form-checkbox>

    <p class="lead pt-2">
      Make articles on this site readable by hiding non-essential page elements
      like sidebars, footers and ads.
    </p>

    <b-row align-content="center" no-gutters class="mb-3">
      <css-property>Font</css-property>

      <css-property-value>
        <b-row no-gutters>
          <b-col cols="10">
            <the-readability-font-family :disabled="!value" />
          </b-col>
        </b-row>
      </css-property-value>
    </b-row>

    <b-row align-content="center" no-gutters class="mb-3">
      <css-property>Theme</css-property>

      <css-property-value>
        <the-readability-theme :disabled="!value" />
      </css-property-value>
    </b-row>

    <b-row align-content="center" no-gutters class="mb-3">
      <css-property>Width</css-property>

      <css-property-value>
        <the-readability-width :disabled="!value" />
      </css-property-value>
    </b-row>

    <b-row align-content="center" no-gutters class="mb-3">
      <css-property>Size</css-property>

      <css-property-value>
        <the-readability-font-size :disabled="!value" />
      </css-property-value>
    </b-row>

    <b-row align-content="center" no-gutters class="mb-3">
      <css-property>Line Height</css-property>

      <css-property-value>
        <the-readability-line-height :disabled="!value" />
      </css-property-value>
    </b-row>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

import CssProperty from '../CssProperty.vue';
import CssPropertyValue from '../CssPropertyValue.vue';

import TheReadabilityWidth from './readability/TheReadabilityWidth.vue';
import TheReadabilityTheme from './readability/TheReadabilityTheme.vue';
import TheReadabilityFontSize from './readability/TheReadabilityFontSize.vue';
import TheReadabilityFontFamily from './readability/TheReadabilityFontFamily.vue';
import TheReadabilityLineHeight from './readability/TheReadabilityLineHeight.vue';

export default Vue.extend({
  name: 'TheReadability',

  components: {
    CssProperty,
    CssPropertyValue,
    TheReadabilityWidth,
    TheReadabilityTheme,
    TheReadabilityFontSize,
    TheReadabilityFontFamily,
    TheReadabilityLineHeight,
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
