<template>
  <v-navigation-drawer app permanent clipped color="#fff">
    <v-list nav class="py-0 pt-2 mb-2">
      <v-list-item-group v-model="model">
        <v-list-item
          link
          :key="tab"
          class="pl-5"
          :ripple="false"
          v-for="tab in tabs"
          @click="$emit('select', tab)"
        >
          <v-list-item-content>
            <v-list-item-title>{{ tab }}</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list-item-group>
    </v-list>

    <v-divider />

    <div class="ma-4 ml-7">
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
