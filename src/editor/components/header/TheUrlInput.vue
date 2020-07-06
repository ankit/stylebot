<template>
  <b-input v-model="url" size="sm" class="the-url-input" />
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'TheUrlInput',

  computed: {
    url(): string {
      return this.$store.state.url;
    },
  },
});
</script>

<style lang="scss" scoped>
.the-url-input {
  height: 26px !important;
  font-size: 13px !important;
  padding: 0 12px !important;
  margin-left: -3px !important;
  background: transparent !important;
  width: 185px !important;
  border: none !important;

  &:focus {
    outline: none !important;
    box-shadow: none !important;
  }
}
</style>
