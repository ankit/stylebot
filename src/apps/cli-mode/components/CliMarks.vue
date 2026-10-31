<template>
  <div class="marks" :class="{ capturing: state.capturing }">
    <template v-for="mark in placed">
      <div :key="`box-${mark.n}`" class="box" :style="boxStyle(mark.rect)" />
      <button
        :key="`badge-${mark.n}`"
        type="button"
        class="badge"
        :style="boxStyle(mark.badge)"
        :title="t('mark_n_click_to_remove', [String(mark.n)])"
        @click="$emit('unmark', mark.n)"
      >
        <span class="n">{{ mark.n }}</span>
      </button>
    </template>

    <div v-if="highlight" class="highlight" :style="boxStyle(highlight)" />

    <div v-if="state.drag" class="drag" :style="boxStyle(state.drag)">
      <span class="size">
        {{ formatSize(state.drag) }}
      </span>
    </div>
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';
import type { ViewportRect } from '@stylebot/types';

import { formatSize, placeBadge, toViewportRect } from '../areas';
import type { TerminalState } from '../state';

type PlacedMark = { n: number; rect: ViewportRect; badge: ViewportRect };

/**
 * The marks on the page: a box over each area with a numbered badge, which
 * removes it, the area being dragged out with its size, and the outline of
 * the mark whose chip is hovered. Follows the page as it scrolls. Emits
 * `unmark`.
 */
export default Vue.extend({
  name: 'CliMarks',

  props: {
    state: {
      type: Object as PropType<TerminalState>,
      required: true,
    },
  },

  data() {
    return {
      scroll: { x: scrollX, y: scrollY },
      viewport: { width: innerWidth, height: innerHeight },
    };
  },

  computed: {
    placed(): Array<PlacedMark> {
      return this.state.marks.map(({ n, area }) => {
        const rect = toViewportRect(area, this.scroll);
        return { n, rect, badge: placeBadge(rect, this.viewport) };
      });
    },

    highlight(): ViewportRect | null {
      const mark = this.placed.find(({ n }) => n === this.state.highlighted);
      return mark?.rect ?? null;
    },
  },

  mounted() {
    window.addEventListener('scroll', this.onScroll, { passive: true });
    window.addEventListener('resize', this.onResize);
  },

  beforeDestroy() {
    window.removeEventListener('scroll', this.onScroll);
    window.removeEventListener('resize', this.onResize);
  },

  methods: {
    formatSize,

    onScroll(): void {
      if (scrollX !== this.scroll.x || scrollY !== this.scroll.y) {
        this.scroll = { x: scrollX, y: scrollY };
      }
    },

    onResize(): void {
      this.viewport = { width: innerWidth, height: innerHeight };
      this.onScroll();
    },

    boxStyle({ x, y, width, height }: ViewportRect): Record<string, string> {
      return {
        transform: `translate(${x}px, ${y}px)`,
        width: `${width}px`,
        height: `${height}px`,
      };
    },
  },
});
</script>

<style lang="scss" scoped>
.marks {
  --mark: #4fb6b0;
  --mark-ink: #0f1a19;

  position: fixed;
  inset: 0;
  overflow: hidden;
  pointer-events: none;

  &.capturing {
    visibility: hidden;
  }
}

.box,
.highlight,
.drag {
  position: absolute;
  top: 0;
  left: 0;
  box-sizing: border-box;
}

.box {
  border: 2px solid var(--mark);
  border-radius: 2px;
  background: rgb(79 182 176 / 6%);
}

.badge {
  @include button-reset;

  position: absolute;
  top: 0;
  left: 0;
  display: grid;
  place-items: center;
  border: 2px solid #fff;
  border-radius: 50%;
  background: var(--mark);
  box-shadow: 0 1px 4px rgb(0 0 0 / 35%);
  color: var(--mark-ink);
  font: 700 11px/1 system-ui, sans-serif;
  cursor: pointer;
  pointer-events: auto;

  &:hover {
    background: #15171a;
    color: #fff;

    .n {
      display: none;
    }

    &::after {
      content: '×';
      font-size: 14px;
    }
  }

  &:focus-visible {
    outline: 2px solid var(--mark);
    outline-offset: 1px;
  }
}

.highlight {
  border: 2px solid var(--mark);
  border-radius: 2px;
  box-shadow: 0 0 0 4px rgb(79 182 176 / 30%), 0 0 0 9999px rgb(0 0 0 / 12%);
}

.drag {
  border: 1.5px dashed var(--mark);
  background: rgb(79 182 176 / 8%);
}

.size {
  position: absolute;
  right: 0;
  bottom: -22px;
  padding: 2px 6px;
  border-radius: 5px;
  background: #15171a;
  color: #fff;
  font: 500 11px/14px 'Geist Mono', Menlo, monospace;
  white-space: nowrap;
}
</style>
