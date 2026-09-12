<template>
  <div class="theme-provider"><slot /></div>
</template>

<script lang="ts">
import Vue from 'vue';

export default Vue.extend({
  name: 'ThemeProvider',
});
</script>

<style lang="scss" scoped>
.theme-provider {
  color-scheme: light dark;

  --background: #fff;
  --foreground: #191b1f;
  --muted-foreground: #767676;
  --border: #e9eaee;
  --accent: #f2f3f6;
  --active: #eceef2;

  --primary: #2a5fd6;

  --input: #dfe1e6;
  --icon-foreground: #6a7180;

  --info: #eef3ff;
  --info-border: #dbe4fb;

  --danger: #b3261e;
  --danger-background: #fdf1f0;
  --danger-border: #f6cfcb;

  --ring: var(--primary);
}

@media (prefers-color-scheme: dark) {
  .theme-provider {
    --background: #1c1d21;
    --foreground: #eceef2;
    --muted-foreground: #7d838f;
    --border: #2c2e34;
    --accent: #26282e;
    --active: #2b2d34;

    --primary: #4d80f0;

    --input: #34363d;
    --icon-foreground: #9aa1ae;

    --info: #1f2740;
    --info-border: #2b3654;

    --danger: #f2726a;
    --danger-background: #3a2220;
    --danger-border: #4a2b28;
  }
}
</style>
