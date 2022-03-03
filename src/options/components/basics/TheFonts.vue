<template>
  <b-row no-gutters>
    <div class="mb-3">
      <h2>{{ t('fonts') }}</h2>
      <div class="description">
        {{ t('fonts_description') }}
      </div>
    </div>
    <b-form-input v-model="fonts" width="500" />
    <a
      target="_blank"
      href="https://fonts.google.com/"
      class="description-link mt-2"
    >
      Google Fonts
    </a>
  </b-row>
</template>

<script lang="ts">
import Vue from 'vue';
import { defaultOptions } from '@stylebot/settings';

export default Vue.extend({
  name: 'TheFonts',

  computed: {
    fonts: {
      get(): boolean {
        const fonts =
          this.$store.state.options['fonts'] || defaultOptions.fonts;

        return fonts.join(',');
      },

      set(value: string): void {
        const fonts = value.split(',');
        this.$store.dispatch('setOption', { name: 'fonts', value: fonts });
      },
    },
  },
});
</script>

<style lang="scss" scoped>
.description {
  color: #888;
  font-size: 14px;
}

.description-link {
  font-size: 13px;
}
</style>
