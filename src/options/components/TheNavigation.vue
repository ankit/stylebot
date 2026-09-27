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
  flex: none;
  width: 200px;
  border-right: 1px solid var(--panel-border);
  padding: 24px 12px;
  display: flex;
  flex-direction: column;
}

.logo {
  display: flex;
  align-items: center;
  height: 28px;
  padding: 0 12px;
  margin-bottom: 14px;
}

.nav-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.nav-item {
  all: unset;
  box-sizing: border-box;
  display: block;
  width: 100%;
  padding: 8px 12px;
  border-radius: 8px;
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
  color: var(--text-secondary);
  cursor: pointer;

  &:hover {
    background: var(--hover-tint);
    color: var(--text-primary);
  }

  &:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: -2px;
  }

  &.active {
    font-weight: 600;
    color: var(--text-primary);
    background: var(--active);
  }
}
</style>
