<template>
  <s-tooltip :text="t('switch_to_tab')" class="window-tab-bar">
    <button
      type="button"
      class="window-tab"
      :class="{ background: inBackground }"
      @click="focusPage"
    >
      <img v-if="favIconUrl" class="window-tab-icon" :src="favIconUrl" alt="" />
      <span v-else class="window-tab-icon window-tab-icon-placeholder" />
      <s-text size="small" class="window-tab-title">{{ title }}</s-text>
      <s-text v-if="inBackground" size="caption" class="window-tab-hint">
        {{ t('tab_in_background') }}
      </s-text>
    </button>
  </s-tooltip>
</template>

<script lang="ts">
import Vue from 'vue';
import { SText, STooltip } from '@stylebot/components';

import { getPageBridge } from '@stylebot/page-bridge';

export default Vue.extend({
  name: 'TheWindowTabBar',

  components: {
    SText,
    STooltip,
  },

  computed: {
    title(): string {
      return this.$store.state.tab?.title || this.$store.state.page.href;
    },

    favIconUrl(): string {
      return this.$store.state.tab?.favIconUrl ?? '';
    },

    inBackground(): boolean {
      return this.$store.state.tab?.active === false;
    },
  },

  methods: {
    focusPage(): void {
      getPageBridge().focusPage();
    },
  },
});
</script>

<style lang="scss" scoped>
.window-tab-bar {
  display: block;
  background: var(--tab-surface);
  border-bottom: 1px solid var(--panel-border);
}

.window-tab {
  @include button-reset;
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 6px 14px;
  cursor: pointer;
  text-align: left;
  color: var(--text-primary);

  &:hover {
    background: var(--active);
  }

  @include focus-ring(-2px);
}

.window-tab-icon {
  flex: none;
  width: 16px;
  height: 16px;
  border-radius: 3px;
}

.window-tab-icon-placeholder {
  background: var(--panel-border);
}

.window-tab-title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.window-tab.background {
  .window-tab-icon,
  .window-tab-title {
    opacity: 0.55;
  }
}

.window-tab-hint {
  flex: none;
  height: 16px;
  padding: 0 7px;
  line-height: 16px;
  border-radius: 999px;
  background: var(--panel-border);
  color: var(--text-muted);
}
</style>
