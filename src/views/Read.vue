<template>
  <v-container fluid>
    <v-toolbar app clipped-left>
      <v-toolbar-title class="headline">Bloc</v-toolbar-title>
      <v-spacer/>
      <v-btn flat icon v-shortkey="['ctrl', 'e']" @shortkey="editNote()" @click.stop="editNote()">
        <v-icon>edit</v-icon>
      </v-btn>
      <v-btn flat icon v-shortkey="['ctrl', 'd']" @shortkey="removeDialog = true" @click.stop="removeDialog = true">
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

    <v-dialog v-model="removeDialog" max-width="400">
      <v-card>
        <v-card-title class="headline">Remove note</v-card-title>
        <v-card-text class="subheading text-xs-center">Are you sure you want to remove this note?</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn flat color="error" @click="removeNote()">Yes</v-btn>
          <v-btn flat @click="removeDialog = false">No</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
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
      noteText: "",
      removeDialog: false
    }),
    created() {
      this.uuid = this.$route.params.uuid;
      notes.local.get(this.uuid).then(note => {
        this.note = note;
        this.noteText = marked(note.text);
      });
    },
    methods: {
      editNote() {
        this.$router.push({name: "edit", params: {uuid: this.uuid}});
      },
      removeNote() {
        notes.local.remove(this.uuid).then(res => {
          this.removeDialog = false;
          this.cancel()
        });
      },
      cancel() {
        if (this.removeDialog) {
          this.removeDialog = false;
        } else {
          this.$router.push({name: "home"});
        }
      }
    }
  };
</script>