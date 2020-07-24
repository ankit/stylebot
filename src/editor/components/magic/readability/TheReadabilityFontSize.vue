<template>
  <b-button-group>
    <b-button
      size="sm"
      title="Decrease Font Size"
      variant="outline-secondary"
      :disabled="disabled"
      @click="decrease"
    >
      <b-icon icon="dash" aria-hidden="true" />
    </b-button>

    <b-button
      size="sm"
      title="Increase Font Size"
      variant="outline-secondary"
      :disabled="disabled"
      @click="increase"
    >
      <b-icon icon="plus" aria-hidden="true" />
    </b-button>
  </b-button-group>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'TheReadabilityFontSize',

  props: {
    disabled: Boolean,
  },

  computed: {
    size(): number {
      return this.$store.state.readabilitySettings.size;
    },
  },

  methods: {
    increase() {
      this.$store.dispatch('setReadabilitySettings', {
        ...this.$store.state.readabilitySettings,
        size: this.size + 1,
      });
    },

    decrease() {
      this.$store.dispatch('setReadabilitySettings', {
        ...this.$store.state.readabilitySettings,
        size: this.size - 1,
      });
    },
  },
});
</script>
