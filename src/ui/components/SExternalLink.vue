<script lang="ts">
import type { CreateElement, VNode } from 'vue';
import Vue from 'vue';

/**
 * A link that opens in a new tab, marked with an arrow, for use in running
 * text. A render function, since a template's line breaks would add spaces
 * inside the link.
 */
export default Vue.extend({
  name: 'SExternalLink',

  props: {
    href: {
      type: String,
      required: true,
    },

    // Off where the link stands alone, such as beside a heading.
    underline: {
      type: Boolean,
      default: true,
    },
  },

  render(h: CreateElement): VNode {
    return h(
      'a',
      {
        class: ['external-link', { plain: !this.underline }],
        attrs: { href: this.href, target: '_blank', rel: 'noopener' },
      },
      [...(this.$slots.default ?? []), ' ↗']
    );
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

  &.plain {
    text-decoration: none;
  }

  @include focus-ring(2px);
}
</style>
