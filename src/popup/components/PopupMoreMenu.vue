<template>
  <div>
    <button
      type="button"
      class="popup-more-header"
      :title="t('back')"
      @click="$emit('back')"
    >
      <span class="popup-more-back">
        <chevron-left-icon />
      </span>
      <span class="popup-more-title">{{ t('more') }}</span>
    </button>

    <div class="popup-divider" />

    <div class="popup-menu">
      <popup-row button @click="openOptions">
        <span class="row-label">{{ t('view_options') }}</span>
      </popup-row>

      <popup-row button @click="reportIssue">
        <span class="row-label">{{ t('report_an_issue') }}</span>
      </popup-row>

      <popup-row button @click="donate">
        <span class="row-label">{{ t('donate') }}</span>
      </popup-row>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { openOptions, reportIssue, donate } from '../utils';
import PopupRow from './PopupRow.vue';
import { ChevronLeftIcon } from '@stylebot/icons';

export default Vue.extend({
  name: 'PopupMoreMenu',

  components: {
    PopupRow,
    ChevronLeftIcon,
  },

  methods: {
    openOptions,
    reportIssue,
    donate,
  },
});
</script>

<style lang="scss" scoped>
.popup-more-header {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 10px;
  padding: 12px 16px;
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;

  &:focus-visible {
    outline: 2px solid var(--popup-focus-ring);
    outline-offset: -2px;
  }
}

.popup-more-back {
  flex: none;
  display: flex;
  align-items: center;
}

.popup-more-title {
  display: flex;
  align-items: center;
  flex: 1;
  font-size: 13.5px;
  font-weight: 600;
  line-height: 1.25;
}
</style>
