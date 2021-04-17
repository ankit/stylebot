<template>
  <button :title="`${t('resize')}`">
    <b-icon icon="arrows-expand" rotate="90" />
  </button>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'TheResizeAction',
});
</script>
