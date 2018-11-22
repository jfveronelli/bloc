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
      <v-btn flat icon v-shortkey="['ctrl', 's']" @shortkey="saveNote()" @click.stop="saveNote()">
        <v-icon>save</v-icon>
      </v-btn>
      <v-btn flat icon v-shortkey="['esc']" @shortkey="cancel()" @click.stop="cancel()">
        <v-icon>cancel</v-icon>
      </v-btn>
    </v-toolbar>

    <v-text-field box label="Title" v-model="note.title" :loading="loading"/>

    <v-combobox box multiple chips clearable label="Tags" v-model="note.tags" :items="tags">
      <template slot="selection" slot-scope="data">
        <v-chip close :selected="data.selected" @input="removeTag(data.item)">
          <strong>{{ data.item }}</strong>
        </v-chip>
      </template>
    </v-combobox>

    <v-textarea box auto-grow rows="10" label="Content" v-model="note.text" :loading="loading"></v-textarea>
  </v-container>
</template>

<script>
  import notes from "@/services/notes";

  export default {
    name: "edit",
    data: () => ({
      uuid: null,
      note: notes.new(),
      tags: [],
      locked: false,
      loading: true
    }),
    created() {
      this.uuid = this.$route.params.uuid;
      if (this.uuid) {
        notes.get(this.uuid).then(note => {
          this.note = note;
          this.loading = false;
        });
      } else {
        this.loading = false;
      }
      notes.tags().then(list => this.tags = list);
    },
    methods: {
      readNote(uuid) {
        this.$router.push({name: "read", params: {uuid}});
      },
      saveNote() {
        if (this.uuid) {
          notes.update(this.note).then(res => this.readNote(this.uuid));
        } else {
          notes.add(this.note).then(res => this.readNote(this.note.uuid));
        }
      },
      listNotes() {
        this.$router.push({name: "home"});
      },
      removeTag(tag) {
        this.note.tags.splice(this.note.tags.indexOf(tag), 1);
      },
      cancel() {
        if (this.uuid) {
          this.readNote(this.uuid);
        } else {
          this.listNotes();
        }
      }
    }
  };
</script>