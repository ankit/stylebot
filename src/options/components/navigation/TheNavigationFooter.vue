<template>
  <div class="footer">
    <span class="version">v{{ version }}</span>
    <a target="_blank" href="https://stylebot.dev/help">{{ t('help_options') }}</a>
    <a target="_blank" href="http://github.com/ankit/stylebot">{{ t('github') }}</a>
    <a target="_blank" href="https://ko-fi.com/stylebot">{{ t('donate') }}</a>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { getReleaseVersion } from '@stylebot/utils';

export default Vue.extend({
  name: 'TheNavigationFooter',

  data(): { version: string } {
    return {
      version: getReleaseVersion(),
    };
  },
});
</script>

<style lang="scss" scoped>
.footer {
  padding: 0 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px 10px;
  font-weight: 400;
  font-size: 12px;
  line-height: 1.4;
  color: var(--muted-foreground);
}

.version {
  font-family: 'IBM Plex Mono', monospace;
}

a {
  color: var(--primary);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
}
</style>
