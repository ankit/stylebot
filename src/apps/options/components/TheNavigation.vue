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
  padding: 24px 12px;
  display: flex;
  flex-direction: column;
  background: var(--panel-surface);

  @include phone {
    border-bottom-width: 1px;
    padding: 0 8px;
  }
}

.logo {
  display: flex;
  align-items: center;
  height: 28px;
  padding: 0 12px;
  margin-bottom: 14px;

  @include phone {
    display: none;
  }
}

.nav-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow-x: auto;
  scrollbar-width: none;

  @include phone {
    flex-direction: row;
  }
}

.nav-item {
  @include button-reset;

  display: block;
  flex: none;
  width: 100%;
  padding: 8px 12px;
  border-radius: 8px;
  font-weight: 500;
  font-size: 14px;
  line-height: 20px;
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

  @include phone {
    width: auto;
    padding: 0 12px;
    font-size: 15px;
    line-height: 44px;
    white-space: nowrap;
  }
}
</style>
