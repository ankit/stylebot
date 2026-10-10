<template>
  <div class="diff" :class="{ empty: !lines.length }">
    <template v-for="(line, index) in lines">
      <div v-if="line" :key="index" class="line" :class="kind(line)">
        <span class="sign">{{ line.sign === '-' ? '−' : line.sign }}</span>
        <span class="text">{{ line.text }}</span>
      </div>

      <div v-else :key="index" class="line gap">
        <span class="sign" />
        <span class="text">⋯</span>
      </div>
    </template>

    <span v-if="!lines.length" class="none">{{ t('restore_no_css') }}</span>
  </div>
</template>

<script lang="ts">
import type { PropType } from 'vue';
import Vue from 'vue';

import type { CssDiff, DiffLine } from './diff-css';

export default Vue.extend({
  name: 'VersionDiff',

  props: {
    // A site's changed lines; none shows the css as empty.
    lines: {
      type: Array as PropType<CssDiff['lines']>,
      required: true,
    },
  },

  methods: {
    kind(line: DiffLine): string {
      return { '+': 'added', '-': 'removed', ' ': 'kept' }[line.sign];
    },
  },
});
</script>

<style lang="scss" scoped>
.diff {
  max-height: 320px;
  padding: 8px 0;
  overflow-y: auto;
  border: 1px solid var(--panel-border);
  border-radius: 8px;
  background: var(--code-surface);
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 1.6;
}

.empty {
  padding: 10px 12px;
}

.none {
  color: var(--text-faint);
}

.line {
  display: grid;
  grid-template-columns: 24px minmax(0, 1fr);
  padding-right: 12px;
}

.sign {
  text-align: center;
  user-select: none;
}

.text {
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  color: var(--text-primary);
}

.kept .sign,
.gap .sign,
.kept .text,
.gap .text {
  color: var(--text-faint);
}

.added {
  background: var(--success-background);
}

.added .sign {
  color: var(--success);
}

.removed {
  background: var(--danger-background);
}

.removed .sign {
  color: var(--danger);
}
</style>
