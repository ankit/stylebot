<template>
  <v-navigation-drawer app permanent clipped color="#fff">
    <v-list nav class="py-0 pt-2">
      <v-list-item-group v-model="model">
        <v-list-item
          link
          :ripple="false"
          :key="tab"
          v-for="tab in tabs"
          @click="$emit('select', tab)"
          class="['pl-5', 'navigation-item']"
        >
          <v-list-item-content>
            <v-list-item-title>{{ tab }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list-item-group>
    </v-list>

    <v-divider />

    <div class="ma-4">
      <span class="caption">
        v2.4 •
        <a target="_blank" href="http://github.com/ankit/stylebot">Readme</a> •
        <a
          target="_blank"
          href="https://github.com/ankit/stylebot/blob/master/CHANGELOG.md"
        >Changelog</a>
      </span>
    </div>
  </v-navigation-drawer>
</template>

<script lang="ts">
export default {
  name: 'TheNavigation',
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

  data(): { model: number } {
    return { model: 0 };
  },
};
</script>
