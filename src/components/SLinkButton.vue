<template>
  <button type="button" class="link-button" @click="$emit('click', $event)">
    <slot />
  </button>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'SLinkButton',
});
</script>

<style lang="scss" scoped>
.link-button {
  flex: none;
  padding: 0;
  border: 0;
  border-radius: 3px;
  background: none;
  font: inherit;
  font-size: 13px;
  font-weight: 500;
  color: var(--accent-tint-ink);
  white-space: nowrap;
  cursor: pointer;

  &:hover {
    text-decoration: underline;
  }

  @include focus-ring(2px);
}
</style>
