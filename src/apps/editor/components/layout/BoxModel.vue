<template>
  <div
    class="box-model"
    @mouseover="hoverLayer = layerAt($event.target)"
    @mouseleave="hoverLayer = null"
    @focusin="focusLayer = layerAt($event.target)"
    @focusout="onFocusOut"
  >
    <box-model-ring kind="margin" :label="t('margin')">
      <box-model-ring kind="padding" :label="t('padding')" class="padding">
        <div class="box-model-content">
          <length
            class="box-size-field"
            property="width"
            unit=""
            :aria-label="t('width')"
          />
          <x-icon class="box-size-times" :size="12" aria-hidden="true" />
          <length
            class="box-size-field"
            property="height"
            unit=""
            :aria-label="t('height')"
          />
        </div>
      </box-model-ring>
    </box-model-ring>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { getPageBridge } from '@stylebot/page-bridge';
import type { HighlightLayer } from '@stylebot/page-bridge';
import { XIcon } from '@stylebot/icons';

import Length from '../Length.vue';
import BoxModelRing from './BoxModelRing.vue';

export default Vue.extend({
  name: 'BoxModel',

  components: {
    BoxModelRing,
    Length,
    XIcon,
  },

  data(): {
    hoverLayer: HighlightLayer | null;
    focusLayer: HighlightLayer | null;
    drawn: boolean;
  } {
    return { hoverLayer: null, focusLayer: null, drawn: false };
  },

  computed: {
    // A field being edited wins over wherever the pointer has drifted.
    layer(): HighlightLayer | null {
      return this.activeSelector ? this.focusLayer ?? this.hoverLayer : null;
    },

    activeSelector(): string {
      return this.$store.state.activeSelector;
    },
  },

  watch: {
    layer(): void {
      this.syncHighlight();
    },

    activeSelector(): void {
      this.syncHighlight();
    },

    // Edits land as fresh computed styles, so the boxes follow the new sizes.
    '$store.state.computedStyles'(): void {
      this.syncHighlight();
    },
  },

  beforeDestroy() {
    if (this.drawn) {
      getPageBridge().unhighlight();
    }
  },

  methods: {
    /**
     * Draws the box while the diagram is in use, and clears only a box it
     * drew, so other highlights like a pick's brief peek are left alone.
     */
    syncHighlight(): void {
      if (this.layer) {
        getPageBridge().highlight(this.activeSelector, this.layer);
        this.drawn = true;
      } else if (this.drawn) {
        getPageBridge().unhighlight();
        this.drawn = false;
      }
    },

    layerAt(target: EventTarget | null): HighlightLayer | null {
      const el = target as Element | null;

      if (el?.closest('.box-model-content')) {
        return 'content';
      }

      if (el?.closest('.box-ring-padding')) {
        return 'padding';
      }

      return el?.closest('.box-ring-margin') ? 'margin' : null;
    },

    onFocusOut(event: FocusEvent): void {
      const next = event.relatedTarget as Node | null;
      this.focusLayer =
        next && this.$el.contains(next) ? this.layerAt(next) : null;
    },
  },
});
</script>

<style lang="scss" scoped>
.box-model {
  --box-margin: #fbe1c4;
  --box-padding: #dce6b5;
  --box-content: #c2dbe2;
  --box-margin-label: #8a5a26;
  --box-padding-label: #5a6a24;
  --box-label: #5f5a52;
  --box-value: var(--field-placeholder);

  padding: 4px 0 8px;

  @include dark-mode {
    --box-margin: #2f251c;
    --box-padding: #232c1d;
    --box-content: #1b2a33;
    --box-margin-label: #d9a066;
    --box-padding-label: #a3c47e;
    --box-label: #9aa3ae;
    --box-value: #a3aab6;
  }
}

.padding {
  flex: 1;
}

.box-model-content {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 6px 3px;
  border-radius: 4px;
  background: var(--box-content);
}
.box-size-field.number-field {
  flex: none;
  width: 40px;
  height: 22px;
  background: var(--card-surface);

  ::v-deep .number-input::placeholder {
    color: var(--box-value);
  }

  &:has(.number-input:placeholder-shown):not(:hover):not(:focus-within) {
    border-color: transparent;
  }

  &:has(.number-input:placeholder-shown):hover:not(:focus-within) {
    border-color: var(--field-border-hover);
  }

  ::v-deep .number-input {
    padding: 0 2px;
    text-align: center;
  }
}

.box-size-times {
  flex: none;
  margin: 0 2px;
  color: var(--box-label);
}
</style>
