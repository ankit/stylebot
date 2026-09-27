<template>
  <div class="window-status" role="status">
    <s-text>{{ t('waiting_for_the_page') }}</s-text>
    <s-text size="caption" variant="muted">
      {{ t('waiting_for_the_page_description') }}
    </s-text>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { SText } from '@stylebot/components';

export default Vue.extend({
  name: 'TheWindowStatus',

  components: {
    SText,
  },
});
</script>

<style lang="scss" scoped>
.window-status {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 12px;
  padding: 12px 14px;
  border: 1px solid var(--panel-border);
  border-radius: 10px;
  background: var(--tab-surface);
}
</style>
