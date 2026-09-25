<template>
  <div class="picker">
    <template v-if="sites.length">
      <label
        v-for="site in sites"
        :key="site.url"
        class="site"
        :class="{ unticked: !isSelected(site.url) }"
      >
        <s-checkbox
          :value="isSelected(site.url)"
          @change="toggle(site.url, $event)"
        />

        <span class="label">
          <span
            v-for="(segment, index) in site.segments"
            :key="index"
            :class="segment.subject ? 'url' : 'verb'"
            v-text="segment.text"
          />
        </span>
      </label>

      <s-button
        variant="primary"
        size="small"
        class="restore"
        :disabled="!selected.length"
        @click="$emit('restore', selected)"
      >
        {{ t('restore_this_version') }}
      </s-button>
    </template>

    <s-text v-else size="caption" variant="muted">
      {{ t('restore_same_as_now') }}
    </s-text>
  </div>
</template>

<script lang="ts">
import Vue, { PropType } from 'vue';
import { SButton, SCheckbox, SText } from '@stylebot/components';
import { VersionPreview } from '@stylebot/types';

import { splitAround, Segment } from './split-around';

type Site = { url: string; segments: Array<Segment> };

export default Vue.extend({
  name: 'VersionPicker',

  components: {
    SButton,
    SCheckbox,
    SText,
  },

  props: {
    // What restoring this version would do to the styles as they are now.
    preview: {
      type: Object as PropType<VersionPreview>,
      required: true,
    },
  },

  data(): { selected: Array<string> } {
    return { selected: [] };
  },

  computed: {
    /**
     * Every site this version differs over, each line saying what ticking it
     * would do. A style whose css merely differs is the quiet one — nothing
     * appears or disappears to show it — so it is listed like the rest.
     */
    sites(): Array<Site> {
      return [
        { key: 'restore_add_back_site', urls: this.preview.addedUrls },
        {
          key: 'restore_revert_styles_on_site',
          urls: this.preview.changedUrls,
        },
        { key: 'restore_remove_site', urls: this.preview.removedUrls },
      ].flatMap(({ key, urls }) =>
        urls.map(url => ({
          url,
          segments: splitAround(this.t(key, [url]), url),
        }))
      );
    },
  },

  // Mounted fresh each time the row opens, so it starts from everything and
  // the plain case is one click.
  created() {
    this.selected = this.sites.map(site => site.url);
  },

  methods: {
    isSelected(url: string): boolean {
      return this.selected.includes(url);
    },

    toggle(url: string, ticked: boolean): void {
      this.selected = ticked
        ? [...this.selected, url]
        : this.selected.filter(other => other !== url);
    },
  },
});
</script>

<style lang="scss" scoped>
.picker {
  padding: 12px 18px 20px 128px;
}

.site {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 5px 0;
  cursor: pointer;
}

.unticked .label {
  opacity: 0.6;
}

.label {
  display: flex;
  align-items: baseline;
  gap: 6px;
  min-width: 0;
  font-size: 13.5px;
}

.verb {
  color: var(--text-secondary);
}

.url {
  overflow: hidden;
  font-weight: 600;
  color: var(--text-primary);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.restore {
  margin-top: 20px;
}
</style>
