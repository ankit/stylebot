<template>
  <div>
    <h1>Improve Readability</h1>

    <p class="lead">
      Hide distracting elements and make the page more readable.
    </p>

    <b-row align-content="center" no-gutters>
      <b-button size="sm" variant="outline-secondary" class="mr-2">
        Minimalism
      </b-button>

      <b-button size="sm" variant="outline-secondary" class="mr-2">
        Night Owl
      </b-button>

      <b-button size="sm" variant="outline-secondary" class="mr-2">
        Golden Glow
      </b-button>
    </b-row>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'Readability',
});
</script>
