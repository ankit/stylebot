<template>
  <div class="navigation">
    <div class="logo">
      <logo-icon />
    </div>

    <nav class="nav-list">
      <button
        v-for="tab in tabs"
        :key="tab"
        type="button"
        class="nav-item"
        :class="{ active: currentTab === tab }"
        @click="$emit('select', tab)"
      >
        {{ t(`${tab}_options`) }}
      </button>
    </nav>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { LogoIcon } from '@stylebot/icons';

export default Vue.extend({
  name: 'TheNavigation',

  components: {
    LogoIcon,
  },

  props: {
    tabs: {
      type: Array,
      required: true,
    },

    currentTab: {
      type: String,
      required: true,
    },
  },
});
</script>

<style lang="scss" scoped>
.navigation {
  border: 0 solid var(--panel-border);
  border-width: var(--options-nav-border, 0);
  padding: var(--options-nav-padding, 24px 12px);
  display: flex;
  flex-direction: column;
  background: var(--panel-surface);
}

.logo {
  display: var(--options-nav-logo-display, flex);
  align-items: center;
  height: 28px;
  padding: 0 12px;
  margin-bottom: 14px;
}

.nav-list {
  display: flex;
  flex-direction: var(--options-nav-direction, column);
  gap: 2px;
  overflow-x: auto;
  scrollbar-width: none;
}

.nav-item {
  @include button-reset;

  display: block;
  flex: none;
  width: var(--options-nav-item-width, 100%);
  padding: var(--options-nav-item-padding, 8px 12px);
  border-radius: 8px;
  font-weight: 500;
  font-size: var(--options-nav-item-font-size, 14px);
  line-height: var(--options-nav-item-line-height, 20px);
  white-space: var(--options-nav-item-white-space, normal);
  color: var(--text-secondary);
  cursor: pointer;

  @include hover-capable {
    &:hover {
      background: var(--hover-tint);
      color: var(--text-primary);
    }
  }

  @include focus-ring;

  &.active {
    font-weight: 600;
    color: var(--text-primary);
    background: var(--active);
  }
}
</style>
