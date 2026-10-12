<template>
  <section class="basics-section">
    <div class="header">
      <h2 class="label">{{ label }}</h2>
      <slot name="action" />
    </div>
    <s-list><slot /></s-list>
  </section>
</template>

<script lang="ts">
import Vue from 'vue';

import { SList } from '@stylebot/components';

/**
 * A group of Basics settings: a quiet label, an optional action beside it,
 * and the settings in a list below.
 */
export default Vue.extend({
  name: 'BasicsSection',

  components: {
    SList,
  },

  props: {
    label: {
      type: String,
      required: true,
    },
  },
});
</script>

<style lang="scss" scoped>
.basics-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.header {
  display: flex;
  align-items: flex-end;
  gap: 16px;
  min-height: 16px;
}

.label {
  flex: 1;
  min-width: 0;
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  line-height: 1.2;
  color: var(--text-muted);
}
</style>
