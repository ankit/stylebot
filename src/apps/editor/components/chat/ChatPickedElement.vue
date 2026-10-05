<template>
  <s-attachment
    mono
    role="group"
    class="chat-picked-element"
    :warning="count === 0"
    :aria-label="t('picked_element')"
    :remove-label="t('remove_picked_element')"
    @remove="remove"
    @mouseenter.native="onMouseEnter"
    @mouseleave.native="onMouseLeave"
  >
    <template #media><inspector-icon :size="14" /></template>
    {{ selector }}
    <template v-if="matches" #meta>{{ matches }}</template>
  </s-attachment>
</template>

<script lang="ts">
import Vue from 'vue';

import { SAttachment } from '@stylebot/components';
import { InspectorIcon } from '@stylebot/icons';
import { getPageBridge } from '@stylebot/page-bridge';

import { countSelectorMatches } from '../../utils/selector-matches';

/**
 * The picked element the next message is about, with how many of the
 * page's elements it matches. Hovering it highlights them, and removing it
 * clears the picked element everywhere.
 */
export default Vue.extend({
  name: 'ChatPickedElement',

  components: {
    InspectorIcon,
    SAttachment,
  },

  data(): { count: number | null; hovered: boolean } {
    return {
      count: null,
      hovered: false,
    };
  },

  computed: {
    selector(): string {
      return this.$store.state.activeSelector;
    },

    matches(): string {
      if (this.count === null) {
        return '';
      }

      if (this.count === 0) {
        return this.t('no_matches');
      }

      return this.t(
        this.count === 1 ? 'matches_count_one' : 'matches_count_other',
        [String(this.count)]
      );
    },
  },

  watch: {
    selector: {
      immediate: true,
      handler(): void {
        this.loadCount();

        if (this.hovered) {
          this.highlight();
        }
      },
    },
  },

  beforeDestroy() {
    if (this.hovered) {
      getPageBridge().unhighlight();
    }
  },

  methods: {
    async loadCount(): Promise<void> {
      const { selector } = this;
      const counts = await countSelectorMatches([selector]);

      if (selector === this.selector) {
        this.count = counts[selector] ?? null;
      }
    },

    // The inspector draws its own highlight while picking.
    highlight(): void {
      if (this.selector && !this.$store.state.inspecting) {
        getPageBridge().highlight(this.selector);
      }
    },

    onMouseEnter(): void {
      this.hovered = true;
      this.highlight();
    },

    onMouseLeave(): void {
      this.hovered = false;
      getPageBridge().unhighlight();
    },

    remove(): void {
      this.$store.commit('setActiveSelector', '');
      this.$emit('remove');
    },
  },
});
</script>
