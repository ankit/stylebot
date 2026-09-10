<template>
  <b-row no-gutters>
    <div class="mb-3">
      <h2>{{ t('claude_api_key') }}</h2>
      <div class="description">
        {{ t('claude_api_key_description') }}
      </div>
    </div>
    <b-form-input v-model="claudeApiKey" type="password" width="500" />
    <a
      target="_blank"
      href="https://console.anthropic.com/settings/keys"
      class="description-link mt-2"
    >
      {{ t('claude_api_key_get_one') }}
    </a>
  </b-row>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'TheClaudeApiKey',

  computed: {
    claudeApiKey: {
      get(): string {
        return this.$store.state.options['claudeApiKey'] || '';
      },

      set(value: string): void {
        this.$store.dispatch('setOption', {
          name: 'claudeApiKey',
          value,
        });
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
