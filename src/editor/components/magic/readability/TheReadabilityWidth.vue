<template>
  <b-button-group>
    <b-button
      size="sm"
      title="Decrease Width"
      variant="outline-secondary"
      style="width: 65px;"
      :disabled="disabled"
      @click="decrease"
    >
      <b-icon icon="arrow-right-short" aria-hidden="true" />
      <b-icon icon="arrow-left-short" aria-hidden="true" />
    </b-button>

    <b-button
      size="sm"
      title="Increase Width"
      variant="outline-secondary"
      style="width: 65px;"
      :disabled="disabled"
      @click="increase"
    >
      <b-icon icon="arrow-left-short" aria-hidden="true" />
      <b-icon icon="arrow-right-short" aria-hidden="true" />
    </b-button>
  </b-button-group>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'TheReadabilityWidth',
  props: {
    disabled: Boolean,
  },

  computed: {
    width(): number {
      return this.$store.state.readabilitySettings.width;
    },
  },

  methods: {
    increase() {
      this.$store.dispatch('setReadabilitySettings', {
        ...this.$store.state.readabilitySettings,
        width: this.width + 1,
      });
    },

    decrease() {
      this.$store.dispatch('setReadabilitySettings', {
        ...this.$store.state.readabilitySettings,
        width: this.width - 1,
      });
    },
  },
});
</script>
