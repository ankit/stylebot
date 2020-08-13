<template>
  <b-row align-content="center" no-gutters>
    <box
      class="box-margin"
      :properties="{
        top: 'margin-top',
        right: 'margin-right',
        bottom: 'margin-bottom',
        left: 'margin-left',
      }"
      :label="t('margin')"
      :class="{
        highlighted: shouldHighlight('margin'),
        disabled,
      }"
      :disabled="disabled"
      @input="debouncedInput"
      @mouseenter="mouseenter('margin')"
      @mouseleave="mouseleave('margin')"
    >
      <box
        class="box-border"
        :properties="{
          top: 'border-top-width',
          right: 'border-right-width',
          bottom: 'border-bottom-width',
          left: 'border-left-width',
        }"
        :label="t('border')"
        :class="{
          highlighted: shouldHighlight('border'),
          disabled,
        }"
        :disabled="disabled"
        @input="debouncedInput"
        @mouseenter="mouseenter('border')"
        @mouseleave="mouseleave('border')"
      >
        <box
          class="box-padding"
          :properties="{
            top: 'padding-top',
            right: 'padding-right',
            bottom: 'padding-bottom',
            left: 'padding-left',
          }"
          :label="t('padding')"
          :class="{
            highlighted: shouldHighlight('padding'),
            disabled,
          }"
          :disabled="disabled"
          @input="debouncedInput"
          @mouseenter="mouseenter('padding')"
          @mouseleave="mouseleave('padding')"
        >
          <div
            class="box-element"
            :class="{
              highlighted: shouldHighlight('height'),
              disabled,
            }"
            @mouseenter="mouseenter('height')"
            @mouseleave="mouseleave('height')"
          >
            <b-row align-content="center" no-gutters>
              <box-model-length
                property="width"
                class="box-element-width"
                :disabled="disabled"
                @input="debouncedInput"
              />

              <span class="box-element-x">x</span>

              <box-model-length
                property="height"
                class="box-element-height"
                :disabled="disabled"
                @input="debouncedInput"
              />
            </b-row>
          </div>
        </box>
      </box>
    </box>
  </b-row>
</template>

<script lang="ts">
import Vue from 'vue';
import { debounce } from 'lodash';
import { Highlighter } from '@stylebot/highlighter';

import Box from './Box.vue';
import BoxModelLength from './BoxModelLength.vue';

type HighlightTarget = 'margin' | 'border' | 'padding' | 'height';

export default Vue.extend({
  name: 'BoxModel',

  components: {
    Box,
    BoxModelLength,
  },

  data(): {
    highlighter: Highlighter;
    targets: Array<HighlightTarget>;
    highlightedTarget: HighlightTarget | null;
    debouncedInput?: () => void;
  } {
    return {
      highlighter: new Highlighter({
        onSelect: () => {
          return;
        },
      }),
      targets: [],
      highlightedTarget: null,
    };
  },

  computed: {
    activeSelector(): string {
      return this.$store.state.activeSelector;
    },

    disabled(): boolean {
      return !this.activeSelector;
    },
  },

  created() {
    this.debouncedInput = debounce(this.input, 100);
  },

  methods: {
    highlight() {
      this.highlighter.unhighlight();

      if (this.targets.length > 0) {
        this.highlightedTarget = this.targets[this.targets.length - 1];
        this.highlighter.highlight(this.activeSelector, this.highlightedTarget);
      } else {
        this.highlightedTarget = null;
      }
    },

    input() {
      this.highlight();
    },

    mouseenter(target: HighlightTarget) {
      if (this.disabled) {
        this.targets = [];
        return;
      }

      this.targets.push(target);
      this.highlight();
    },

    mouseleave(target: HighlightTarget) {
      if (this.disabled) {
        this.targets = [];
        return;
      }

      const index = this.targets.indexOf(target);

      if (index > -1) {
        this.targets.splice(index, 1);
      }

      this.highlight();
    },

    shouldHighlight(target: HighlightTarget) {
      return !this.highlightedTarget || this.highlightedTarget === target;
    },
  },
});
</script>

<style lang="scss" scoped>
.box-margin {
  background: #fff;
  border: 1px solid #eee;

  &.highlighted {
    background: rgba(255, 155, 0, 0.3);

    &.disabled {
      background: #eee;
    }
  }
}

.box-border {
  background: #fff;
  border: 1px solid #ccc;

  &.highlighted {
    border: 1px solid #fff;
    background: rgba(255, 200, 50, 0.3);

    &.disabled {
      background: #eee;
    }
  }
}

.box-padding {
  border: 1px dashed #aaa;
  background: #fff;

  &.highlighted {
    background: rgba(77, 200, 0, 0.3);

    &.disabled {
      background: #eee;
    }
  }
}

.box-element {
  height: 24px;
  margin: 0 auto;
  position: relative;
  background: #fff;
  border: 1px solid #888;

  &.highlighted {
    background: rgba(120, 170, 210, 0.7);

    &.disabled {
      background: #eee;
    }
  }
}

.box-element-width {
  left: 2px;
  top: 2px;
  position: absolute;
}

.box-element-height {
  right: 2px;
  top: 2px;
  position: absolute;
}

.box-element-x {
  color: #333;
  position: absolute;
  top: 2px;
  left: calc(50% - 4px);
  font-size: 12px;
  line-height: 18px;
}
</style>
