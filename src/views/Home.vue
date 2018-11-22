<template>
  <v-container fluid>
    <v-navigation-drawer app clipped v-model="drawer">
      <v-list dense>
        <v-list-tile>
          <v-list-tile-action>
            <v-icon>settings</v-icon>
          </v-list-tile-action>
          <v-list-tile-content>
            <v-list-tile-title>Settings</v-list-tile-title>
          </v-list-tile-content>
        </v-list-tile>
        <v-list-tile>
          <v-list-tile-action>
            <v-icon>sync</v-icon>
          </v-list-tile-action>
          <v-list-tile-content>
            <v-list-tile-title>Synchronize</v-list-tile-title>
          </v-list-tile-content>
        </v-list-tile>
        <v-list-group v-model="drawerTag">
          <v-list-tile slot="activator">
            <v-list-tile-content>
              <v-list-tile-title>Tags</v-list-tile-title>
            </v-list-tile-content>
          </v-list-tile>
          <v-list-tile v-for="(tag, i) in tags" :key="i" @click="toggleTagFilter(tag)">
            <v-list-tile-action>
              <v-icon v-if="$root.$data.selectedTags.includes(tag)" color="yellow">label</v-icon>
              <v-icon v-else>label</v-icon>
            </v-list-tile-action>
            <v-list-tile-content>
              <v-list-tile-title>{{ tag }}</v-list-tile-title>
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
        <v-text-field flat solo clearable hide-details prepend-inner-icon="search" label="Search" v-model="$root.$data.searchText" v-if="search" v-on:input="refreshNotes()"/>
      </v-slide-x-transition>
      <v-btn flat icon v-if="!search" @click.stop="search = !search">
        <v-icon>search</v-icon>
      </v-btn>
    </v-toolbar>

    <v-container>
      <v-list v-if="notes.length > 0">
        <template v-for="(note, i) in notes">
          <v-divider inset :key="i" v-if="i > 0"></v-divider>
          <v-list-tile avatar :key="note.title" @click="$router.push({name: 'read', params: {uuid: note.uuid}})">
            <v-list-tile-avatar>
              <v-icon>notes</v-icon>
            </v-list-tile-avatar>
            <v-list-tile-content>
              <v-list-tile-title>{{ note.title }}</v-list-tile-title>
              <v-list-tile-sub-title>
                <v-chip disabled small text-color="black" v-for="(tag, i) in note.tags" :key="i">{{ tag }}</v-chip>
              </v-list-tile-sub-title>
            </v-list-tile-content>
            <v-list-tile-action>
              <v-btn flat icon @click.stop="removeNote(i)">
                <v-icon>delete</v-icon>
              </v-btn>
            </v-list-tile-action>
          </v-list-tile>
        </template>
      </v-list>
    </v-container>

    <v-btn fab fixed bottom right dark color="pink" v-shortkey="['ctrl', 'a']" @shortkey="createNote()" @click="createNote()">
      <v-icon>add</v-icon>
    </v-btn>
  </v-container>
</template>

<script>
  import notes from "@/services/notes";

  export default {
    name: "home",
    data: () => ({
      drawer: null,
      drawerTag: true,
      search: false,
      tags: [],
      notes: []
    }),
    created() {
      this.search = !!this.$root.$data.searchText;
      this.refreshTagsAndNotes();
    },
    methods: {
      toggleTagFilter(tag) {
        if (this.$root.$data.selectedTags.includes(tag)) {
          this.$root.$data.selectedTags.splice(this.$root.$data.selectedTags.indexOf(tag), 1);
        } else {
          this.$root.$data.selectedTags.push(tag);
        }
        this.refreshNotes();
      },
      refreshTagsAndNotes() {
        notes.tags().then(list => {
          this.$root.$data.selectedTags = this.$root.$data.selectedTags.filter(tag => list.includes(tag));
          this.tags = list;
          this.refreshNotes();
        });
      },
      refreshNotes() {
        notes.list(this.$root.$data.selectedTags, this.$root.$data.searchText).then(list => this.notes = list);
      },
      createNote() {
        this.$router.push({name: "new"});
      },
      removeNote(index) {
        notes.remove(this.notes[index].uuid).then(res => this.refreshTagsAndNotes());
      }
    }
  };
</script>