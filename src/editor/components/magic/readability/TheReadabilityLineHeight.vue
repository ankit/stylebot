<template>
  <b-button-group>
    <b-button
      size="sm"
      title="Decrease Line Height"
      variant="outline-secondary"
      :disabled="disabled"
      @click="decrease"
    >
      <b-icon icon="dash" aria-hidden="true" />
    </b-button>

    <b-button
      size="sm"
      title="Increase Line Height"
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
  name: 'TheReadabilityLineHeight',

  props: {
    disabled: Boolean,
  },

  computed: {
    lineHeight(): number {
      return this.$store.state.readabilitySettings.lineHeight;
    },
  },

  methods: {
    increase() {
      this.$store.dispatch('setReadabilitySettings', {
        ...this.$store.state.readabilitySettings,
        lineHeight: this.lineHeight + 0.1,
      });
    },

    decrease() {
      this.$store.dispatch('setReadabilitySettings', {
        ...this.$store.state.readabilitySettings,
        lineHeight: this.lineHeight - 0.1,
      });
    },
  },
});
</script>
