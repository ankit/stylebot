<template>
  <div class="navigation">
    <div class="header mb-3">
      stylebot
      <span class="light ml-1 d-md-inline-flex d-none">{{ currentTab }}</span>
    </div>

    <b-list-group class="navigation-list">
      <b-list-group-item
        v-for="tab in tabs"
        :key="tab"
        button
        class="navigation-item"
        :active="currentTab === tab"
        @click="$emit('select', tab)"
      >
        {{ tab }}
      </b-list-group-item>
    </b-list-group>

    <the-navigation-footer class="mt-4" />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import TheNavigationFooter from './navigation/TheNavigationFooter.vue';

export default Vue.extend({
  name: 'TheNavigation',

  components: {
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
.header {
  font-size: 34px;

  .light {
    font-weight: 200;
    text-transform: lowercase;
  }
}

.navigation {
  height: 100%;
  border-right: 1px solid #eee;
}

.navigation-list {
  border-radius: 0;
}

.navigation-item {
  border: none;

  &:hover:not(.active) {
    background: #ddd;
  }

  &:focus {
    outline: none;
  }
}
</style>
