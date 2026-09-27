<template>
  <button type="button" class="pill-btn" @click="$emit('click', $event)">
    <span class="pill-btn-label"><slot /></span>
    <slot name="trailing" />
  </button>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'SPillButton',
});
</script>

<style lang="scss" scoped>
.pill-btn {
  display: flex;
  align-items: center;
  flex: 1;
  min-height: 40px;
  padding: 9px 12px;
  border-radius: 8px;
  border: 1px solid var(--pill-border);
  background: var(--pill-surface);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: var(--pill-hover);
  }

  @include focus-ring;
}

.pill-btn-label {
  flex: 1;
  text-align: center;
}
</style>
