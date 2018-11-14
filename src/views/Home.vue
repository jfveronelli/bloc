<template>
  <v-container fluid>
    <v-navigation-drawer app clipped v-model="drawer">
      <v-list dense>
        <v-list-tile @click="">
          <v-list-tile-action>
            <v-icon>settings</v-icon>
          </v-list-tile-action>
          <v-list-tile-content>
            <v-list-tile-title>Settings</v-list-tile-title>
          </v-list-tile-content>
        </v-list-tile>
        <v-list-tile @click="">
          <v-list-tile-action>
            <v-icon>sync</v-icon>
          </v-list-tile-action>
          <v-list-tile-content>
            <v-list-tile-title>Synchronize</v-list-tile-title>
          </v-list-tile-content>
        </v-list-tile>
        <v-list-group v-model="drawerLabel">
          <v-list-tile slot="activator">
            <v-list-tile-content>
              <v-list-tile-title>Labels</v-list-tile-title>
            </v-list-tile-content>
          </v-list-tile>
          <v-list-tile v-for="(label, i) in labels" :key="i" @click="">
            <v-list-tile-action>
              <v-icon>label</v-icon>
            </v-list-tile-action>
            <v-list-tile-content>
              <v-list-tile-title>{{ label }}</v-list-tile-title>
            </v-list-tile-content>
          </v-list-tile>
        </v-list-group>
      </v-list>
    </v-navigation-drawer>

    <v-toolbar app clipped-left>
      <v-toolbar-side-icon @click.stop="drawer = !drawer"></v-toolbar-side-icon>
      <v-toolbar-title class="headline">Bloc</v-toolbar-title>
      <v-spacer/>
      <v-slide-x-transition>
        <v-text-field flat solo hide-details prepend-inner-icon="search" label="Search" v-if="search"/>
      </v-slide-x-transition>
      <v-btn flat icon v-if="!search" @click.stop="search = !search">
        <v-icon>search</v-icon>
      </v-btn>
    </v-toolbar>

    <Listing/>

    <v-btn fab fixed bottom right dark color="pink" @click="$router.push({name: 'new'})">
      <v-icon>add</v-icon>
    </v-btn>
  </v-container>
</template>

<script>
  import Listing from "@/components/Listing.vue";

  export default {
    name: "home",
    components: {Listing},
    data: () => ({
      drawer: null,
      drawerLabel: true,
      search: false,
      labels: [
        "Duplicates",
        "Settings",
        "Send feedback",
        "Help",
        "App downloads",
        "Go to the old version",
        "Contacts",
        "Frequently contacted",
        "Duplicates",
        "Settings",
        "Send feedback",
        "Help",
        "App downloads",
        "Go to the old version",
        "Contacts",
        "Frequently contacted",
        "Duplicates",
        "Settings",
        "Send feedback",
        "Help",
        "App downloads",
        "Go to the old version",
        "Contacts",
        "Frequently contacted",
        "Duplicates",
        "Settings",
        "Send feedback",
        "Help",
        "App downloads",
        "Go to the old version",
        "Contacts",
        "Frequently contacted",
        "Duplicates",
        "Settings",
        "Send feedback",
        "Help",
        "App downloads",
        "Go to the old version"
      ]
    })
  };
</script>