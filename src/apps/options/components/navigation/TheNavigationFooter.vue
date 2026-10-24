<template>
  <div class="footer">
    <div class="links">
      <a target="_blank" :href="manualUrl">{{ t('help_options') }}</a>
      <a target="_blank" href="https://github.com/ankit/stylebot/issues">
        {{ t('feedback') }}
      </a>
      <a target="_blank" href="https://ko-fi.com/stylebot">{{ t('donate') }}</a>
    </div>

    <a
      class="version"
      target="_blank"
      href="https://github.com/ankit/stylebot"
      :title="t('github')"
    >
      v{{ version }}
    </a>
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
  gap: 6px;
  font-weight: 400;
  font-size: 13px;
  line-height: 1.4;
  color: var(--text-faint);
}

.links {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
}

a {
  color: var(--text-muted);
  text-decoration: none;
  border-radius: 3px;

  &:hover {
    color: var(--text-primary);
  }

  @include focus-ring(2px);
}

.version {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-faint);
}
</style>
