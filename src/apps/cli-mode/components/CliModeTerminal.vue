<template>
  <s-theme-provider
    ref="root"
    class="root"
    mode="dark"
    :style="{
      right: `${state.position.right}px`,
      bottom: `${state.position.bottom}px`,
    }"
  >
    <section
      class="term"
      :class="{ expanded: state.expanded }"
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
          @undo="$emit('undo', $event)"
        />
        <cli-mark-chips
          :marks="state.marks"
          @highlight="$emit('highlight', $event)"
          @unmark="$emit('unmark', $event)"
        />
        <footer class="footer">
          <cli-status v-if="!state.activity" :agent="state.agent" />
        </footer>
      </template>

      <cli-pill
        v-else
        :agent="state.agent"
        :activity="state.activity"
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

import type { TerminalState } from '../state';
import CliMarkChips from './CliMarkChips.vue';
import CliInvite from './CliInvite.vue';
import CliPill from './CliPill.vue';
import CliStatus from './CliStatus.vue';
import CliThread from './CliThread.vue';
import CliTitleBar from './CliTitleBar.vue';

// The closest the terminal comes to the viewport's edges.
const EDGE = 8;

/**
 * CLI mode's floating mini terminal: a pill, the open thread with the marks,
 * or an invite on other tabs while an agent waits. Drag it to move it.
 */
export default Vue.extend({
  name: 'CliModeTerminal',

  components: {
    CliMarkChips,
    CliInvite,
    CliPill,
    CliStatus,
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
    return { seenSaves: 0 };
  },

  computed: {
    saves(): number {
      return this.state.thread
        .flatMap(turn => turn.steps)
        .filter(step => step.kind === 'save').length;
    },

    // Saves the agent made while the terminal was collapsed.
    unseen(): number {
      return this.saves - this.seenSaves;
    },
  },

  watch: {
    async 'state.thread'(): Promise<void> {
      if (this.state.expanded) {
        this.seenSaves = this.saves;
        await this.$nextTick();
        this.scrollThread();
      }
    },

    async 'state.expanded'(expanded: boolean): Promise<void> {
      if (expanded) {
        this.seenSaves = this.saves;
      }

      // The panel is taller than the pill, so it may need moving into view.
      await this.keepInView();

      if (expanded) {
        this.scrollThread();
      }
    },
  },

  created() {
    this.seenSaves = this.saves;
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
     * pill, then tells the page where it ended up, to remember.
     */
    startDrag(event: PointerEvent): void {
      if ((event.target as Element).closest('button') || event.button !== 0) {
        return;
      }

      const handle = event.currentTarget as HTMLElement;
      const start = { x: event.clientX, y: event.clientY };
      const from = { ...this.state.position };

      const move = (moved: PointerEvent): void => {
        this.place(
          from.right - (moved.clientX - start.x),
          from.bottom - (moved.clientY - start.y)
        );
      };

      const end = (): void => {
        handle.removeEventListener('pointermove', move);
        handle.removeEventListener('pointerup', end);
        handle.removeEventListener('pointercancel', end);
        this.$emit('move', { ...this.state.position });
      };

      event.preventDefault();
      handle.setPointerCapture(event.pointerId);
      handle.addEventListener('pointermove', move);
      handle.addEventListener('pointerup', end);
      handle.addEventListener('pointercancel', end);
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
  --term-accent: #4fb6b0;
  --term-green: #8fbf7f;

  position: fixed;
  background: none;
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 20px;
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
    display: flex;
    flex-direction: column;
    width: 440px;
    height: min(420px, calc(100vh - 16px));
    overflow: hidden;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
}

.thread {
  flex: 1;
}

.footer {
  display: flex;
  align-items: center;
  min-height: 28px;
  padding: 4px 14px;
  border-top: 1px solid var(--term-border);
  background: var(--term-raised);
}

@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
}
</style>
