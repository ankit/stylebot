<template>
  <div class="footer">
    <span class="version">v{{ version }}</span>
    <div class="links">
      <a target="_blank" :href="manualUrl">
        {{ t('help_options') }}
      </a>
      <a target="_blank" href="http://github.com/ankit/stylebot">
        {{ t('github') }}
      </a>
      <a target="_blank" href="https://ko-fi.com/stylebot">{{ t('donate') }}</a>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { getExtensionVersion, getSiteUrl } from '@stylebot/utils';

export default Vue.extend({
  name: 'TheNavigationFooter',

  data(): { version: string; manualUrl: string } {
    return {
      version: getExtensionVersion(),
      manualUrl: getSiteUrl('/manual'),
    };
  },
});
</script>

<style lang="scss" scoped>
.footer {
  padding: 0 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-weight: 400;
  font-size: 13px;
  line-height: 1.4;
  color: var(--text-muted);
}

.links {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 10px;
}

.version {
  font-family: var(--font-mono);
}

a {
  color: var(--accent-text);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}
</style>
