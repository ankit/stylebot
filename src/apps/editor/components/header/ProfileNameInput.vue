<template>
  <!-- A "search" name keeps Safari from offering contacts for this field. -->
  <input
    ref="input"
    :value="value"
    class="name-input"
    name="profile-search"
    autocomplete="off"
    :class="{ invalid: !!error }"
    :aria-label="t('profile_name')"
    :aria-invalid="error ? 'true' : 'false'"
    :title="error"
    @input="onInput"
    @click.stop
    @keydown.enter.prevent="$emit('submit')"
  />
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'ProfileNameInput',

  props: {
    value: {
      type: String,
      required: true,
    },

    // Why the name can't be saved, or ''.
    error: {
      type: String,
      default: '',
    },
  },

  mounted() {
    const input = this.$refs.input as HTMLInputElement;

    input.focus();
    input.select();
  },

  methods: {
    onInput(event: Event): void {
      this.$emit('input', (event.target as HTMLInputElement).value);
    },
  },
});
</script>

<style lang="scss" scoped>
.name-input {
  flex: 1;
  width: 0;
  min-width: 0;
  height: 24px;
  margin-left: -6px;
  padding: 0 6px;
  border: none;
  border-radius: 6px;
  outline: none;
  font: inherit;
  color: var(--text-primary);
  background: var(--field-surface);
  box-shadow: 0 0 0 1.5px var(--accent);

  &.invalid {
    box-shadow: 0 0 0 1.5px var(--danger);
  }
}
</style>
