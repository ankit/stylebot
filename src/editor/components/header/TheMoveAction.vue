<template>
  <button :title="`${t('drag_and_resize')}`">
    <b-icon icon="arrows-move" />
  </button>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'TheMoveAction',
});
</script>
