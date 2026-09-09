<template>
  <div ref="root" class="anchored-menu">
    <slot name="trigger" :toggle="toggleOpen" :open="open" />

    <div v-if="open" class="anchored-menu-panel">
      <slot :close="close" />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'AnchoredMenu',

  data(): { open: boolean } {
    return { open: false };
  },

  watch: {
    open(isOpen: boolean): void {
      if (isOpen) {
        document.addEventListener('mousedown', this.onDocMousedown);
        document.addEventListener('keydown', this.onDocKeydown);
        this.$emit('open');
      } else {
        document.removeEventListener('mousedown', this.onDocMousedown);
        document.removeEventListener('keydown', this.onDocKeydown);
        this.$emit('close');
      }
    },
  },

  beforeDestroy() {
    document.removeEventListener('mousedown', this.onDocMousedown);
    document.removeEventListener('keydown', this.onDocKeydown);
  },

  methods: {
    toggleOpen(): void {
      this.open = !this.open;
    },

    close(): void {
      this.open = false;
    },

    onDocMousedown(event: MouseEvent): void {
      if (!this.$el.contains(event.target as Node)) {
        this.close();
      }
    },

    onDocKeydown(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        this.close();
      }
    },
  },
});
</script>

<style lang="scss" scoped>
.anchored-menu {
  position: relative;
  display: inline-flex;
}

.anchored-menu-panel {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 6px;
  z-index: 20;
}
</style>
