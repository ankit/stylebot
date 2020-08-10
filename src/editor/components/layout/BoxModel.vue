<template>
  <b-row align-content="center" no-gutters>
    <box
      property="margin"
      class="box-margin"
      :label="t('margin')"
      :class="{
        highlighted: shouldHighlight('margin'),
        disabled,
      }"
      :disabled="disabled"
      @input="debouncedInput"
      @mouseenter="highlight('margin')"
      @mouseleave="unhighlight('margin')"
    >
      <box
        property="border"
        class="box-border"
        :label="t('border')"
        :class="{
          highlighted: shouldHighlight('border'),
          disabled,
        }"
        :disabled="disabled"
        @input="debouncedInput"
        @mouseenter="highlight('border')"
        @mouseleave="unhighlight('border')"
      >
        <box
          property="padding"
          class="box-padding"
          :label="t('padding')"
          :class="{
            highlighted: shouldHighlight('padding'),
            disabled,
          }"
          :disabled="disabled"
          @input="debouncedInput"
          @mouseenter="highlight('padding')"
          @mouseleave="unhighlight('padding')"
        >
          <div
            class="box-element"
            :class="{
              highlighted: shouldHighlight('height'),
              disabled,
            }"
            @mouseenter="highlight('height')"
            @mouseleave="unhighlight('height')"
          >
            <b-row align-content="center" no-gutters>
              <box-model-length
                property="height"
                class="box-element-height"
                :disabled="disabled"
                @input="debouncedInput"
              />

              <span class="box-element-x">x</span>

              <box-model-length
                property="width"
                class="box-element-width"
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
    highlightedTargets: Array<HighlightTarget>;
    debouncedInput?: () => void;
  } {
    return {
      highlighter: new Highlighter({
        onSelect: () => {
          return;
        },
      }),
      highlightedTargets: [],
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
    input() {
      this.highlighter.unhighlight();

      this.highlighter.highlight(
        this.activeSelector,
        this.highlightedTargets[this.highlightedTargets.length - 1]
      );
    },

    highlight(target: HighlightTarget) {
      if (this.disabled) {
        this.highlightedTargets = [];
        return;
      }

      this.highlightedTargets.push(target);

      this.highlighter.unhighlight();
      this.highlighter.highlight(this.activeSelector, target);
    },

    unhighlight(target: HighlightTarget) {
      if (this.disabled) {
        this.highlightedTargets = [];
        return;
      }

      const index = this.highlightedTargets.indexOf(target);

      if (index > -1) {
        this.highlightedTargets.splice(index, 1);
      }

      if (this.highlightedTargets.length > 0) {
        this.highlighter.unhighlight();

        this.highlighter.highlight(
          this.activeSelector,
          this.highlightedTargets[this.highlightedTargets.length - 1]
        );
      } else {
        this.highlighter.unhighlight();
      }
    },

    shouldHighlight(target: HighlightTarget) {
      return (
        this.highlightedTargets.length === 0 ||
        this.highlightedTargets.indexOf(target) > -1
      );
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
  height: 25px;
  background: #fff;
  border: 1px solid #888;

  &.highlighted {
    background: rgba(120, 170, 210, 0.7);

    &.disabled {
      background: #eee;
    }
  }
}

.box-element-height,
.box-element-width {
  margin-top: 3px;
}

.box-element-height {
  margin-left: 1px;
}

.box-element-x {
  color: #333;
  font-size: 12px;
  padding: 2px 3px;
}
</style>
