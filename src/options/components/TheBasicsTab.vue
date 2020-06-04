<template>
  <div class="v-basics-tab">
    <h2 class="title">Shortcut Key</h2>
    <v-switch label="Enable shortcut key to launch Stylebot"></v-switch>

    <v-col cols="4">
      <v-row justify="space-around" pad>
        <v-select
          items="Alt, Ctrl, Shift"
          label="Alt"
          solo
          width="200px"
        ></v-select>

        <v-spacer></v-spacer>
        <v-text-field></v-text-field>
      </v-row>
    </v-col>

    <h2 class="title">Default Editing Mode</h2>

    <v-radio-group>
      <v-radio label="Basic"></v-radio>
      <v-radio label="Advanced"></v-radio>
      <v-radio label="Edit CSS"></v-radio>
    </v-radio-group>

    <h2 class="title">Context Menu</h2>
    <v-switch label="Show Right Click Context Menu"></v-switch>
  </div>
</template>

<script lang="ts">
export default {
  name: 'TheBasicsTab',
};
</script>
