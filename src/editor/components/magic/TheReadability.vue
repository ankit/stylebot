<template>
  <div class="the-readability">
    <b-form-checkbox v-model="value" switch class="enable-readability">
      {{ t('enable_readability') }}
    </b-form-checkbox>

    <p class="lead pt-2">
      {{ t('readability_description') }}
    </p>

    <b-row align-content="center" no-gutters class="mb-3">
      <css-property>{{ t('font_family') }}</css-property>

      <css-property-value>
        <b-row no-gutters>
          <b-col cols="10">
            <the-readability-font-family :disabled="!value" />
          </b-col>
        </b-row>
      </css-property-value>
    </b-row>

    <b-row align-content="center" no-gutters class="mb-3">
      <css-property>{{ t('theme') }}</css-property>

      <css-property-value>
        <the-readability-theme :disabled="!value" />
      </css-property-value>
    </b-row>

    <b-row align-content="center" no-gutters class="mb-3">
      <css-property>{{ t('width') }}</css-property>

      <css-property-value>
        <the-readability-width :disabled="!value" />
      </css-property-value>
    </b-row>

    <b-row align-content="center" no-gutters class="mb-3">
      <css-property>{{ t('font_size') }}</css-property>

      <css-property-value>
        <the-readability-font-size :disabled="!value" />
      </css-property-value>
    </b-row>

    <b-row align-content="center" no-gutters class="mb-3">
      <css-property>{{ t('line_height') }}</css-property>

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

.enable-readability {
  &.custom-switch {
    font-size: 14px;
  }
}
</style>
