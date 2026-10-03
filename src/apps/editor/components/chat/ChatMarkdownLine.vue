<script lang="ts">
import type { CreateElement, PropType, VNode } from 'vue';
import Vue from 'vue';

import type { MarkdownLine } from '@stylebot/chat';

const TAGS = { code: 'code', strong: 'strong', em: 'em' } as const;

/**
 * One line of a reply's markdown: its text, code, strong and em runs, then
 * the tail (the streaming caret). Rendered without a template, since any
 * whitespace between the runs would show as a space.
 */
export default Vue.extend({
  name: 'ChatMarkdownLine',

  props: {
    line: {
      type: Array as PropType<MarkdownLine>,
      required: true,
    },

    tail: {
      type: Array as PropType<Array<VNode>>,
      default: () => [],
    },
  },

  render(h: CreateElement): VNode {
    const runs = (line: MarkdownLine): Array<VNode | string> =>
      line.map(run => {
        if (run.type === 'text') {
          return run.text;
        }

        return h(
          TAGS[run.type],
          { class: `markdown-${run.type}` },
          run.type === 'code' ? run.text : runs(run.children)
        );
      });

    return h('span', { class: 'markdown-line' }, [
      ...runs(this.line),
      ...this.tail,
    ]);
  },
});
</script>

<style lang="scss" scoped>
.markdown-line,
.markdown-strong,
.markdown-em {
  font-family: inherit;
}

.markdown-strong {
  font-weight: 500;
  color: var(--reading-strong);
}

.markdown-code {
  padding: 1px 4px;
  border-radius: 4px;
  background: color-mix(in srgb, var(--text-primary) 8%, transparent);
  font-family: var(--font-mono);
  font-size: 12px;
}
</style>
