<template>
  <!-- Copyright 2014 The Chromium Authors. All rights reserved. -->
  <!-- derived from https://github.com/ChromeDevTools/devtools-frontend/blob/master/front_end/Images/largeIcons.svg -->
  <!-- todo: this is identical to editor/components/header/InspectorIcon.vue. figure out dependency strategy to re-use. -->
  <svg
    version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    width="30"
    height="30"
    viewBox="0 0 747 640"
  >
    <path
      fill="#000"
      d="M257.773 572.188h-117.81c-47.353 0-70.839-23.486-70.839-70.839v-424.461c0-47.353 23.486-70.839 70.839-70.839h424.461c70.839 0 70.839 69.108 70.839 70.839v117.81h-47.353v-141.489h-471.626v471.626h141.489zM682.234 336.375l-141.489 94.324 141.489 141.489-47.353 47.353-141.489-141.489-94.324 141.489-94.324-377.108z"
    ></path>
  </svg>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'InspectorIcon',
});
</script>
