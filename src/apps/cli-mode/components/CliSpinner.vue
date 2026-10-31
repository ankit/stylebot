<template>
  <svg
    class="spinner"
    width="11"
    height="10"
    viewBox="0 0 13 12"
    aria-hidden="true"
  >
    <rect class="bar pink" x="0" y="0.5" width="12" height="2.4" rx="1.2" />
    <rect class="bar cyan" x="0" y="4.8" width="12" height="2.4" rx="1.2" />
    <rect class="bar amber" x="0" y="9.1" width="10" height="2.4" rx="1.2" />
    <rect class="cursor" x="10.8" y="7.6" width="1.3" height="4.4" rx="0.6" />
  </svg>
</template>

<script lang="ts">
import Vue from 'vue';

/**
 * Stylebot's icon at text size, its bars restyling and its cursor blinking,
 * while the agent works.
 */
export default Vue.extend({
  name: 'CliSpinner',
});
</script>

<style lang="scss" scoped>
.spinner {
  display: block;
  flex: none;
  align-self: center;
  overflow: visible;
}

.bar {
  transform-box: fill-box;
  transform-origin: left center;
  animation: restyle 1.6s ease-in-out infinite;
}

.pink {
  fill: #ec4d86;
}

.cyan {
  fill: #1c9fc4;
  animation-delay: -0.55s;
}

.amber {
  fill: #e0a218;
  animation-delay: -1.1s;
}

.cursor {
  fill: #2563eb;
  animation: follow 1.6s ease-in-out -1.1s infinite,
    blink 0.8s steps(1) infinite;
}

@keyframes restyle {
  0%,
  100% {
    transform: scaleX(1);
  }

  50% {
    transform: scaleX(0.35);
  }
}

@keyframes follow {
  0%,
  100% {
    transform: translateX(0);
  }

  50% {
    transform: translateX(-6.5px);
  }
}

@keyframes blink {
  50% {
    opacity: 0.35;
  }
}

@media (prefers-reduced-motion: reduce) {
  .bar,
  .cursor {
    animation: none;
  }
}
</style>
