<template>
  <s-theme-provider
    ref="root"
    class="root"
    :class="{ dragging: !!cursor }"
    mode="dark"
    :style="{
      right: `${state.position.right}px`,
      bottom: `${state.position.bottom}px`,
      '--drag-cursor': cursor,
    }"
  >
    <section
      class="term"
      :class="{ expanded: state.expanded }"
      :style="panelSize"
      role="region"
      :aria-label="t('stylebot_cli_mode')"
    >
      <cli-invite
        v-if="state.invite"
        :connected-to="state.invite.connectedTo"
        @drag="startDrag"
        @connect="$emit('connect')"
        @dismiss="$emit('dismiss')"
      />

      <template v-else-if="state.expanded">
        <cli-title-bar
          @drag="startDrag"
          @minimize="$emit('expand', false)"
          @close="$emit('close')"
        />
        <cli-thread
          ref="thread"
          class="thread"
          :thread="state.thread"
          :activity="state.activity"
          :thinking="state.thinking"
          @undo="$emit('undo', $event)"
        />
        <cli-composer
          ref="composer"
          :marks="state.marks"
          @highlight="$emit('highlight', $event)"
          @unmark="$emit('unmark', $event)"
          @note="$emit('note', $event)"
        />
        <cli-footer
          :agent="state.agent"
          :thread="state.thread"
          :marked="state.marks.length > 0"
        />
        <cli-resize-handles @grab="startResize" />
      </template>

      <cli-pill
        v-else
        :agent="state.agent"
        :activity="state.activity"
        :thinking="state.thinking"
        :unseen="unseen"
        @drag="startDrag"
        @open="$emit('expand', true)"
        @close="$emit('close')"
      />
    </section>
  </s-theme-provider>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';
import { SThemeProvider } from '@stylebot/components';

import { EDGE, followPointer, resizeFrom } from '../resize';
import type { TerminalState } from '../state';
import { threadSteps } from '../thread';
import CliComposer from './CliComposer.vue';
import CliFooter from './CliFooter.vue';
import CliInvite from './CliInvite.vue';
import CliPill from './CliPill.vue';
import CliResizeHandles from './CliResizeHandles.vue';
import CliThread from './CliThread.vue';
import CliTitleBar from './CliTitleBar.vue';

/**
 * CLI mode's floating mini terminal: a pill, the open thread, or an invite.
 * Drag it to move it; a reply opens it.
 */
export default Vue.extend({
  name: 'CliModeTerminal',

  components: {
    CliComposer,
    CliFooter,
    CliInvite,
    CliPill,
    CliResizeHandles,
    CliThread,
    CliTitleBar,
    SThemeProvider,
  },

  props: {
    state: {
      type: Object as PropType<TerminalState>,
      required: true,
    },
  },

  data() {
    // The cursor while the user moves or resizes the terminal.
    return { seen: 0, cursor: null as string | null };
  },

  computed: {
    replies(): number {
      return this.state.thread.filter(entry => entry.kind === 'reply').length;
    },

    // The agent's replies and saves, which the pill counts.
    news(): number {
      return (
        this.replies +
        threadSteps(this.state.thread).filter(step => step.kind === 'save')
          .length
      );
    },

    panelSize(): Record<string, string> {
      const { size, expanded } = this.state;

      return size && expanded
        ? { width: `${size.width}px`, height: `${size.height}px` }
        : {};
    },

    // Replies and saves that came while the terminal was collapsed.
    unseen(): number {
      return this.news - this.seen;
    },
  },

  watch: {
    replies(count: number, before: number): void {
      if (count > before && !this.state.expanded && !this.state.invite) {
        this.$emit('expand', true);
      }
    },

    async 'state.thread'(): Promise<void> {
      if (this.state.expanded) {
        this.seen = this.news;
        await this.$nextTick();
        this.scrollThread();
      }
    },

    async 'state.expanded'(expanded: boolean): Promise<void> {
      if (expanded) {
        this.seen = this.news;
      }

      // The panel is taller than the pill, so it may need moving into view.
      await this.keepInView();

      if (expanded) {
        this.scrollThread();
      }
    },
  },

  created() {
    this.seen = this.news;
  },

  mounted() {
    window.addEventListener('resize', this.keepInView);
  },

  beforeDestroy() {
    window.removeEventListener('resize', this.keepInView);
  },

  methods: {
    /**
     * Moves the terminal with the pointer from a press on its title bar or
     * pill.
     */
    startDrag(event: PointerEvent): void {
      if ((event.target as Element).closest('button') || event.button !== 0) {
        return;
      }

      const from = { ...this.state.position };

      this.follow(event, 'grabbing', delta =>
        this.place(from.right - delta.x, from.bottom - delta.y)
      );
    },

    /**
     * Resizes the open terminal with the pointer from one of its edges or
     * corners.
     */
    startResize(event: PointerEvent, edge: string): void {
      if (event.button !== 0) {
        return;
      }

      const { width, height } = (
        this.$refs.root as Vue
      ).$el.getBoundingClientRect();
      const from = {
        size: { width, height },
        position: { ...this.state.position },
      };
      const cursor = getComputedStyle(event.currentTarget as Element).cursor;

      this.follow(event, cursor, delta => {
        const resized = resizeFrom(edge, from, delta, {
          width: innerWidth,
          height: innerHeight,
        });

        this.$emit('resize', resized.size);
        this.$emit('place', resized.position);
      });
    },

    /**
     * Follows the pointer with `move`, showing `cursor` everywhere on the
     * terminal, then tells the page where it ended up, to remember.
     */
    follow(
      event: PointerEvent,
      cursor: string,
      move: (delta: { x: number; y: number }) => void
    ): void {
      this.cursor = cursor;
      followPointer(event, move, () => {
        this.cursor = null;
        this.$emit('move', { ...this.state.position });
      });
    },

    /**
     * Puts the terminal at offsets from the viewport's right and bottom, kept
     * wholly in view.
     */
    place(right: number, bottom: number): void {
      const { width, height } = (
        this.$refs.root as Vue
      ).$el.getBoundingClientRect();

      this.$emit('place', {
        right: Math.round(
          Math.max(Math.min(right, innerWidth - width - EDGE), EDGE)
        ),
        bottom: Math.round(
          Math.max(Math.min(bottom, innerHeight - height - EDGE), EDGE)
        ),
      });
    },

    async keepInView(): Promise<void> {
      await this.$nextTick();
      this.place(this.state.position.right, this.state.position.bottom);
    },

    /**
     * Puts the keyboard in the note field, once the terminal is open.
     */
    focusNote(): void {
      (
        this.$refs.composer as (Vue & { focus: () => void }) | undefined
      )?.focus();
    },

    scrollThread(): void {
      const thread = (this.$refs.thread as Vue | undefined)?.$el;
      thread?.scrollTo({ top: thread.scrollHeight });
    },
  },
});
</script>

<style lang="scss" scoped>
.root {
  --term-bg: #161513;
  --term-raised: #1b1a17;
  --term-border: #2a2824;
  --term-bright: #d4cec2;
  --term-text: #bcb6aa;
  --term-dim: #8c867b;
  --term-faint: #6c675e;
  --term-accent: #3fb4d9;
  --term-gutter: 11px;
  --term-green: #8fbf7f;

  position: fixed;
  background: none;
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 18px;
  pointer-events: auto;
}

.term {
  box-sizing: border-box;
  max-width: calc(100vw - 16px);
  border: 1px solid var(--term-border);
  border-radius: 10px;
  background: var(--term-bg);
  box-shadow: 0 18px 40px rgb(0 0 0 / 28%), 0 2px 6px rgb(0 0 0 / 18%);
  color: var(--term-text);
  animation: rise 160ms cubic-bezier(0.2, 0.8, 0.2, 1);

  &.expanded {
    position: relative;
    display: flex;
    flex-direction: column;
    width: 440px;
    height: min(420px, calc(100vh - 16px));
    max-height: calc(100vh - 16px);
    overflow: hidden;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
}

.thread {
  flex: 1;
}

.root.dragging ::v-deep * {
  cursor: var(--drag-cursor);
}

@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
}
</style>
