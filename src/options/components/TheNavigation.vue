<template>
  <div class="navigation">
    <heading as="div" size="md" class="wordmark">Stylebot</heading>

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

    <div class="spacer" />

    <the-navigation-footer />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Heading } from '@stylebot/components';
import TheNavigationFooter from './navigation/TheNavigationFooter.vue';

export default Vue.extend({
  name: 'TheNavigation',

  components: {
    Heading,
    TheNavigationFooter,
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
  width: 216px;
  border-right: 1px solid var(--ui-border);
  padding: 20px 12px;
  display: flex;
  flex-direction: column;
}

.wordmark {
  padding: 0 12px 20px;
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
  font-weight: 400;
  font-size: 13.5px;
  line-height: 1.3;
  color: var(--ui-fg-muted);
  cursor: pointer;

  &:hover {
    background: var(--ui-hover-bg);
  }

  &:focus-visible {
    outline: 2px solid var(--ui-focus-ring);
    outline-offset: -2px;
  }

  &.active {
    font-weight: 600;
    color: var(--ui-fg);
    background: var(--ui-active-bg);
  }
}

.spacer {
  flex: 1;
  min-height: 120px;
}
</style>
