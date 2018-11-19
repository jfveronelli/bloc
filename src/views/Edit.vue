<template>
  <v-container fluid>
    <v-toolbar app clipped-left>
      <v-toolbar-title class="headline">Bloc</v-toolbar-title>
      <v-spacer/>
      <v-btn flat icon v-if="!locked" @click.stop="locked = !locked">
        <v-icon>lock</v-icon>
      </v-btn>
      <v-btn flat icon v-if="locked" @click.stop="locked = !locked">
        <v-icon>lock_open</v-icon>
      </v-btn>
      <v-btn flat icon @click.stop="saveNote()">
        <v-icon>save</v-icon>
      </v-btn>
      <v-btn flat icon @click.stop="cancel()">
        <v-icon>cancel</v-icon>
      </v-btn>
    </v-toolbar>

    <v-text-field box label="Title" v-model="note.title" :loading="loading"/>

    <v-textarea box auto-grow rows="10" label="Content" v-model="note.text" :loading="loading"></v-textarea>
  </v-container>
</template>

<script>
  import notes from "@/services/notes";

  export default {
    name: "edit",
    data: () => ({
      locked: false,
      loading: true,
      new: false,
      note: notes.new()
    }),
    created() {
      let id = this.$route.params.id || null;
      if (id) {
        notes.get(id).then(note => {
          this.loading = false;
          this.note = note;
        });
      } else {
        this.loading = false;
        this.new = true;
      }
    },
    methods: {
      saveNote() {
        if (this.new) {
          notes.add(this.note).then(res => this.$router.push({name: "home"}));
        } else {
          notes.update(this.note).then(res => this.$router.push({name: "read", params: {id: this.note.id}}));
        }
      },
      cancel() {
        if (this.new) {
          this.$router.push({name: "home"});
        } else {
          this.$router.push({name: 'read', params: {id: this.note.id}});
        }
      }
    }
  };
</script>