<template>
  <span class="night-owl">
    <span class="moon" />
    <span class="star" />
    <span class="star dim" />
  </span>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'NightOwlPreview',
});
</script>

<style lang="scss" scoped>
.night-owl {
  background: #1e1814;
}

.moon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  box-shadow: inset -7px -3px 0 0 #f0a63a;
  transform: rotate(-20deg);
}

.star {
  position: absolute;
  top: 12px;
  right: 22px;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: #efe3cf;
}

.dim {
  top: auto;
  right: 34px;
  bottom: 14px;
  width: 2px;
  height: 2px;
  background: #a8957a;
}
</style>
