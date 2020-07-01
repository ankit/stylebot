<template>
  <b-col cols="7">
    <b-form-group>
      <b-form-radio-group
        buttons
        size="sm"
        :name="name"
        v-model="selected"
        :options="options"
        button-variant="outline-secondary"
      />
    </b-form-group>
  </b-col>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'CssPropertyValueGroup',
  props: ['name', 'options', 'selected'],
});
</script>
