<template>
  <button type="button" class="pill-btn" @click="$emit('click', $event)">
    <span class="pill-btn-label"><slot /></span>
    <slot name="trailing" />
  </button>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'PillButton',
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
  border: 1px solid #d3d6dd;
  background: #fff;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: #f2f3f6;
  }

  &:focus-visible {
    outline: 2px solid var(--ui-focus-ring);
    outline-offset: 1px;
  }
}

@media (prefers-color-scheme: dark) {
  .pill-btn {
    border-color: #3a3d45;
    background: #26282e;

    &:hover {
      background: #31343b;
    }
  }
}

.pill-btn-label {
  flex: 1;
  text-align: center;
}
</style>
