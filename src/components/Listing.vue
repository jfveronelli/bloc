<template>
  <v-container>
    <v-list >
      <template v-for="(note, i) in $root.$data.notes">
        <v-divider inset :key="i" v-if="i > 0"></v-divider>
        <v-list-tile avatar :key="note.title" @click="$router.push({name: 'read', params: {id: i}})">
          <v-list-tile-avatar>
            <v-icon>notes</v-icon>
          </v-list-tile-avatar>
          <v-list-tile-content>
            <v-list-tile-title>{{ note.title }}</v-list-tile-title>
            <v-list-tile-sub-title>
              <v-chip disabled small text-color="black" v-for="(label, i) in note.labels" :key="i">{{ label }}</v-chip>
            </v-list-tile-sub-title>
          </v-list-tile-content>
          <v-list-tile-action>
            <v-btn flat icon @click.stop="deleteNote(i)">
              <v-icon>delete</v-icon></v-btn>
          </v-list-tile-action>
        </v-list-tile>
      </template>
    </v-list>
  </v-container>
</template>

<script>
  export default {
    name: "listing",
    methods: {
      deleteNote(index) {
        this.$root.$data.notes.splice(index, 1);
      }
    }
  };
</script>