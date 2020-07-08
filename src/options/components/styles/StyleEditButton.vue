<template>
  <b-btn
    size="sm"
    class="icon-btn"
    title="Edit Style"
    @click="$emit('click')"
    variant="outline-primary"
  >
    <b-icon icon="pencil" />
  </b-btn>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'StyleEditButton',
});
</script>

<style lang="scss" scoped>
.icon-btn {
  font-size: 13px;
  border-radius: 30px;
  height: 35px;
  width: 36px;
  padding: 0;
}
</style>
