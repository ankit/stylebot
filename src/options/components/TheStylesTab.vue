<template>
  <div>
    <h2 class="title">Styles</h2>
    <v-row no-gutters>
      <v-col cols="6">
        <v-row>
          <v-col cols="10">
            <app-button color="primary" text="Add a new style..." />
            <app-button text="Enable all" />
            <app-button text="Disable all" />
          </v-col>

          <v-col cols="2">
            <app-button text="Delete all" color="red lighten-2" />
          </v-col>
        </v-row>

        <v-row class="search">
          <v-col cols="12">
            <v-text-field placeholder="Search..." hide-details></v-text-field>
          </v-col>
        </v-row>

        <v-row
          class="style"
          align="center"
          justify="end"
          :key="style.url"
          v-for="style in styles"
        >
          <v-col cols="10">
            <v-checkbox
              :value="style.enabled"
              :label="style.url"
              :ripple="false"
              hide-details
            >
            </v-checkbox>
          </v-col>

          <v-col cols="2">
            <v-row align="center" justify="end">
              <v-dialog
                v-model="edit"
                scrollable
                max-width="600px"
                transition="false"
              >
                <template v-slot:activator="{ on }">
                  <v-btn
                    color="primary"
                    :ripple="false"
                    elevation="0"
                    fab
                    x-small
                    v-on="on"
                    class="style-action"
                    ><v-icon>mdi-pencil</v-icon></v-btn
                  >
                </template>

                <v-card>
                  <v-card-title>Edit Style</v-card-title>
                  <v-divider></v-divider>
                  <v-card-text> </v-card-text>
                  <v-divider></v-divider>
                  <v-card-actions>
                    <v-btn color="blue darken-1" text @click="edit = false"
                      >Close</v-btn
                    >
                  </v-card-actions>
                </v-card>
              </v-dialog>

              <v-btn
                color="error"
                :ripple="false"
                elevation="0"
                fab
                x-small
                class="style-action"
                ><v-icon>mdi-delete</v-icon></v-btn
              >
            </v-row>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import AppButton from './AppButton.vue';

type Style = {
  url: string;
  enabled: boolean;
  rules: any;
};

type StylebotBackgroundPage = {
  cache: {
    styles: {
      get: () => {
        [url: string]: {
          _enabled: boolean;
          _rules: any;
        };
      };
    };
  };
};

export default Vue.extend({
  name: 'TheStylesTab',
  components: {
    AppButton,
  },

  data(): {
    styles: Array<Style>;
  } {
    return {
      styles: [],
    };
  },

  created(): void {
    const backgroundPage = (chrome.extension.getBackgroundPage() as any) as StylebotBackgroundPage;
    const styles = backgroundPage.cache.styles.get();
    const urls = Object.keys(styles);

    this.styles = urls.map(url => {
      const style = styles[url];

      return {
        url,
        rules: style._rules,
        enabled: style._enabled,
      };
    });
  },
});
</script>

<style scoped>
.style:hover {
  background-color: #eee;
}

.style .v-input {
  margin: 0;
  padding: 0;
}

.style-action {
  margin-right: 8px;
}
</style>
