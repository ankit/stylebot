<template>
  <s-button
    variant="primary"
    class="install"
    :class="{ installing }"
    :disabled="installing"
    :aria-busy="installing ? 'true' : undefined"
    @click="$emit('install')"
    @animationend.native="$emit('filled')"
  >
    {{ t('install') }}
  </s-button>
</template>

<script lang="ts">
import Vue from 'vue';
import { SButton } from '@stylebot/components';

/**
 * The Install button, which fills while `installing` and emits `filled` once
 * it's full, however fast the install itself is.
 */
export default Vue.extend({
  name: 'InstallButton',

  components: {
    SButton,
  },

  props: {
    installing: {
      type: Boolean,
      default: false,
    },
  },
});
</script>

<style lang="scss" scoped>
.install {
  position: relative;
  overflow: hidden;
}

.button.install.installing:disabled {
  opacity: 1;
  filter: brightness(0.88);
}

.install.installing::before {
  position: absolute;
  inset: 0;
  background: rgb(255 255 255 / 22%);
  transform-origin: left center;
  animation: fill 800ms cubic-bezier(0.45, 0, 0.25, 1) both;
  content: '';

  @media (prefers-reduced-motion: reduce) {
    animation-name: fade-in;
  }
}

@keyframes fill {
  from {
    transform: scaleX(0);
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
}
</style>
