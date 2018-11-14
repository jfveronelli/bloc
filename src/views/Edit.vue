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

    <v-text-field box label="Title" :value="note.title" :loading="loading"/>

    <v-textarea box auto-grow rows="10" label="Content" :value="note.content" :loading="loading"></v-textarea>
  </v-container>
</template>

<script>
  export default {
    name: "edit",
    data: () => ({
      locked: false,
      loading: true,
      id: null,
      note: {title: "", labels: [], content: ""}
    }),
    created() {
      this.id = this.$route.params.id || null;
      if (this.id) {
        this.note = this.$root.$data.notes[this.id];
      }
      this.loading = false;
    },
    methods: {
      saveNote() {
        //todo
        if (this.id) {
          this.$router.push({name: "read", params: {id: this.id}});
        } else {
          this.$router.push({name: "home"});
        }
      },
      cancel() {
        if (this.id) {
          this.$router.push({name: 'read', params: {id: this.id}});
        } else {
          this.$router.push({name: "home"});
        }
      }
    }
  };
</script>