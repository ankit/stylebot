<template>
  <v-app>
    <v-app-bar
      app
      clipped-left
      :elevation="0"
      color="#fff"
      style="border-bottom: 1px solid #eee"
    >
      <span class="title ml-3 mr-5"
        >Stylebot<span class="font-weight-light"> | options</span></span
      >
      <v-spacer></v-spacer>
    </v-app-bar>

    <the-navigation
      v-bind:tabs="tabs"
      v-bind:currentTab="currentTab"
      v-on:select="currentTab = $event"
    />

    <v-content>
      <v-container fluid>
        <component v-bind:is="currentTabComponent"></component>
      </v-container>
    </v-content>
  </v-app>
</template>

<script lang="ts">
import Vue from 'vue';

import TheBasicsTab from './components/TheBasicsTab.vue';
import TheStylesTab from './components/TheStylesTab.vue';
import TheNavigation from './components/TheNavigation.vue';

export default Vue.extend({
  name: 'App',

  data(): {
    currentTab: string;
    tabs: Array<string>;
  } {
    return {
      currentTab: 'Basics',
      tabs: ['Basics', 'Styles', 'Export'],
    };
  },

  components: {
    TheBasicsTab,
    TheStylesTab,
    TheNavigation,
  },

  created() {
    //
  },

  computed: {
    currentTabComponent(): string {
      return `the-${this.currentTab.toLowerCase()}-tab`;
    },
  },
});
</script>

<style scoped>
.container {
  padding: 16px 36px;
}
</style>
