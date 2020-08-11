<template>
  <div
    class="box"
    @mouseenter="$emit('mouseenter')"
    @mouseleave="$emit('mouseleave')"
  >
    <span class="box-label">{{ label }}</span>

    <box-model-length
      class="box-top"
      :disabled="disabled"
      :property="`${property}-top`"
      @input="$emit('input')"
    />

    <box-model-length
      class="box-right"
      :disabled="disabled"
      :property="`${property}-right`"
      @input="$emit('input')"
    />

    <box-model-length
      class="box-bottom"
      :disabled="disabled"
      :property="`${property}-bottom`"
      @input="$emit('input')"
    />

    <box-model-length
      class="box-left"
      :disabled="disabled"
      :property="`${property}-left`"
      @input="$emit('input')"
    />

    <slot />
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import BoxModelLength from './BoxModelLength.vue';

export default Vue.extend({
  name: 'Box',

  components: {
    BoxModelLength,
  },

  props: {
    property: {
      type: String,
      required: true,
    },

    label: {
      type: String,
      required: true,
    },

    disabled: {
      type: Boolean,
    },
  },
});
</script>

<style lang="scss" scoped>
.box {
  width: 100%;
  padding: 24px 32px;
  position: relative;
}

.box-label {
  font-size: 10px;
  position: absolute;
  top: 3px;
  left: 7px;
  color: #333;
}

.box-top {
  top: 3px;
  position: absolute;
  left: calc(100% / 2 - 18px);
}
.box-right {
  right: 0;
  position: absolute;
  top: calc(50% - 9px);
}
.box-left {
  left: 0;
  position: absolute;
  top: calc(50% - 9px);
}
.box-bottom {
  bottom: 3px;
  position: absolute;
  left: calc(100% / 2 - 18px);
}
</style>
