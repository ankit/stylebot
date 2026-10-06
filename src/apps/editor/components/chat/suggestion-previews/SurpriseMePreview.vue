<template>
  <span class="surprise-me">
    <span v-for="piece in 5" :key="piece" class="piece" />
  </span>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'SurpriseMePreview',
});
</script>

<style lang="scss" scoped>
.surprise-me {
  border: 1px dashed var(--muted);
}

.piece {
  width: 11px;
  height: 11px;
  border-radius: 3px;

  &:nth-child(1) {
    background: #f3eee3;
    box-shadow: 0 0 0 1px var(--muted);
    transform: rotate(-14deg) translateY(-6px);
  }

  &:nth-child(2) {
    width: 9px;
    height: 9px;
    border-radius: 50%;
    background: #3fdc6a;
    transform: translateY(8px);
  }

  &:nth-child(3) {
    width: 13px;
    height: 13px;
    background: #e3262b;
    transform: rotate(10deg) translateY(-2px);
  }

  &:nth-child(4) {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #88c0d0;
    transform: translateY(-9px);
  }

  &:nth-child(5) {
    background: #f0a63a;
    transform: rotate(-6deg) translateY(6px);
  }
}
</style>
