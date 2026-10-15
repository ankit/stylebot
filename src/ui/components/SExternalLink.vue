<template>
  <a class="external-link" :href="href" target="_blank" rel="noopener">
    <slot />
    ↗
  </a>
</template>

<script lang="ts">
import Vue from 'vue';

/**
 * A link that opens in a new tab, marked with an arrow, for use in running
 * text.
 */
export default Vue.extend({
  name: 'SExternalLink',

  props: {
    href: {
      type: String,
      required: true,
    },
  },
});
</script>

<style lang="scss" scoped>
.external-link {
  color: var(--accent-text);
  text-decoration: underline;
  text-decoration-color: color-mix(
    in srgb,
    var(--accent-text) 40%,
    transparent
  );
  text-underline-offset: 3px;

  &:hover {
    text-decoration-color: currentColor;
  }

  @include focus-ring(2px);
}
</style>
