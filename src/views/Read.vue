<template>
  <v-container fluid>
    <v-toolbar app clipped-left>
      <v-toolbar-title class="headline">Bloc</v-toolbar-title>
      <v-spacer/>
      <v-btn flat icon v-shortkey="['ctrl', 'e']" @shortkey="editNote()" @click.stop="editNote()">
        <v-icon>edit</v-icon>
      </v-btn>
      <v-btn flat icon v-shortkey="['ctrl', 'd']" @shortkey="removeNote()" @click.stop="removeNote()">
        <v-icon>delete</v-icon>
      </v-btn>
      <v-btn flat icon v-shortkey="['esc']" @shortkey="cancel()" @click.stop="cancel()">
        <v-icon>keyboard_backspace</v-icon>
      </v-btn>
    </v-toolbar>
    <v-layout justify-center>
      <v-flex xs12 md10 lg8>
        <v-card>
          <v-card-title primary class="title">{{ note.title }}</v-card-title>
          <v-card-text>
            <div v-html="noteText"></div>
          </v-card-text>
        </v-card>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
  import marked from "marked";
  import notes from "@/services/notes";

  export default {
    name: "read",
    data: () => ({
      uuid: null,
      note: notes.new(),
      noteText: ""
    }),
    created() {
      this.uuid = this.$route.params.uuid;
      notes.get(this.uuid).then(note => {
        this.note = note;
        this.noteText = marked(note.text);
      });
    },
    methods: {
      editNote() {
        this.$router.push({name: "edit", params: {uuid: this.uuid}});
      },
      removeNote() {
        notes.remove(this.uuid).then(res => this.cancel());
      },
      cancel() {
        this.$router.push({name: "home"});
      }
    }
  };
</script>