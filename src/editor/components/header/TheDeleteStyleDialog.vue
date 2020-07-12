<template>
  <div class="delete-css-dialog">
    <div class="delete-css-dialog-content pb-3">
      <h1 class="title">Delete style for {{ url }}</h1>

      <div class="description text-muted mt-2 mb-4">
        This will permanently delete your css for {{ url }}. You cannot undo
        this.
      </div>

      <b-row class="justify-content-end mr-2">
        <b-col cols="2" class="mr-2">
          <b-btn variant="outline-secondary" @click="$emit('close')">Cancel</b-btn>
        </b-col>

        <b-col cols="2">
          <b-btn variant="outline-danger" @click="deleteStyle">Delete</b-btn>
        </b-col>
      </b-row>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'TheDeleteStyleDialog',

  computed: {
    url(): string {
      return this.$store.state.url;
    },
  },

  methods: {
    deleteStyle(): void {
      this.$store.dispatch('applyCss', { css: '' });
      this.$emit('close');
    },
  },
});
</script>

<style lang="scss" scoped>
.delete-css-dialog {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1050;
  display: block;
  width: 100%;
  height: 100%;
  overflow: hidden;
  outline: 0;
  background: #000000b3;
}

.delete-css-dialog-content {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  pointer-events: auto;
  background-color: #fff;
  outline: 0;
  width: 540px;
  margin: 300px auto;
  padding: 30px;
}

.title {
  color: #000;
  font-size: 24px;
  font-weight: 250;
}

.description {
  font-weight: 250;
  font-size: 18px;
}
</style>
