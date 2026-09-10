<template>
  <div class="the-css-generator">
    <p class="lead">{{ t('css_generator_description') }}</p>

    <template v-if="apiKeyConfigured">
      <b-form-textarea
        v-model="prompt"
        :placeholder="t('css_generator_placeholder')"
        :disabled="generating"
        rows="3"
        max-rows="6"
        @keydown.enter.exact.prevent="submit"
      />

      <div class="mt-2 d-flex align-items-center">
        <b-button
          variant="primary"
          size="sm"
          :disabled="!prompt.trim() || generating"
          @click="submit"
        >
          <b-icon v-if="generating" icon="arrow-repeat" animation="spin" />
          {{ generating ? t('generating_css') : t('generate_css') }}
        </b-button>
      </div>

      <p v-if="error" class="text-danger mt-2 mb-0 error-message">
        {{ errorMessage }}
      </p>
    </template>

    <p v-else class="mb-0">
      {{ t('css_generator_missing_api_key') }}
      <a href="#" @click.prevent="openOptions">{{ t('add_claude_api_key') }}</a>
    </p>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { openOptionsPage } from '../../utils/chrome';

export default Vue.extend({
  name: 'TheCssGenerator',

  data() {
    return {
      prompt: '',
    };
  },

  computed: {
    generating(): boolean {
      return this.$store.state.aiGenerating;
    },

    error(): string | null {
      return this.$store.state.aiError;
    },

    apiKeyConfigured(): boolean {
      return !!this.$store.state.options.claudeApiKey;
    },

    errorMessage(): string {
      switch (this.error) {
        case 'missing_api_key':
        case 'invalid_api_key':
          return this.t('css_generator_error_api_key');
        case 'rate_limited':
          return this.t('css_generator_error_rate_limited');
        case 'refusal':
          return this.t('css_generator_error_refusal');
        default:
          return this.t('css_generator_error_generic');
      }
    },
  },

  methods: {
    submit(): void {
      const prompt = this.prompt.trim();

      if (!prompt || this.generating) {
        return;
      }

      this.$store.dispatch('generateCssWithAi', prompt);
    },

    openOptions(): void {
      openOptionsPage();
    },
  },
});
</script>

<style lang="scss" scoped>
.error-message {
  font-size: 13px;
}
</style>
