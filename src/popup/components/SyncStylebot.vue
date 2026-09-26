<template>
  <button type="button" class="sync-strip" @click="openSyncOptions">
    <span class="sync-status">{{ t('sync_needs_sign_in') }}</span>
    <chevron-right-icon :size="14" />
  </button>
</template>

<script lang="ts">
import Vue from 'vue';

import { ChevronRightIcon } from '@stylebot/icons';
import { openSyncOptions } from '../utils';

export default Vue.extend({
  name: 'SyncStylebot',

  components: {
    ChevronRightIcon,
  },

  methods: {
    openSyncOptions,
  },
});
</script>

<style lang="scss" scoped>
.sync-strip {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 14px 10px 16px;
  border: 0;
  background: transparent;
  text-align: left;
  color: var(--danger);
  cursor: pointer;

  &:hover {
    background: var(--hover-tint);
  }

  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: -2px;
  }
}

.sync-status {
  flex: 1;
  min-width: 0;
  font-size: 12.5px;
  line-height: 1.35;
}
</style>
