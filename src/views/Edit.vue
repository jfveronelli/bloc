<template>
  <v-container fluid>
    <v-toolbar app clipped-left>
      <v-toolbar-title class="headline">Bloc</v-toolbar-title>
      <v-spacer/>
      <v-tooltip bottom>
        <v-btn flat icon slot="activator" :disabled="loading || (!noteEncrypted && !$root.$data.password)" @click.stop="noteEncrypted = !noteEncrypted">
          <v-icon v-if="noteEncrypted">lock_open</v-icon>
          <v-icon v-else>lock</v-icon>
        </v-btn>
        <span v-if="noteEncrypted">Unlock</span>
        <span v-else>Lock</span>
      </v-tooltip>
      <v-tooltip bottom>
        <v-btn flat icon slot="activator" :disabled="loading" v-shortkey="['ctrl', 's']" @shortkey="saveNote()" @click.stop="saveNote()">
          <v-icon>save</v-icon>
        </v-btn>
        <span>Save<br/>[ Ctrl S ]</span>
      </v-tooltip>
      <v-tooltip bottom>
        <v-btn flat icon slot="activator" v-shortkey="['esc']" @shortkey="cancelDialog = true" @click.stop="cancelDialog = true">
          <v-icon>keyboard_backspace</v-icon>
        </v-btn>
        <span>Cancel<br/>[ Esc ]</span>
      </v-tooltip>
    </v-toolbar>

    <v-container v-if="!loading">
      <v-text-field box label="Title" v-model="note.title"/>
      <v-combobox box multiple chips clearable label="Tags" v-model="note.tags" :items="tags">
        <template slot="selection" slot-scope="data">
          <v-chip close :selected="data.selected" @input="removeTag(data.item)">
            <strong>{{ data.item }}</strong>
          </v-chip>
        </template>
        <template slot="no-data">
          <v-list-tile>
            <v-list-tile-content>
              <v-list-tile-title>
                Press <kbd>enter</kbd> to add a new tag.
              </v-list-tile-title>
            </v-list-tile-content>
          </v-list-tile>
        </template>
      </v-combobox>
      <v-textarea box auto-grow rows="10" label="Content" v-model="note.text"></v-textarea>
    </v-container>

    <v-dialog v-model="cancelDialog" max-width="400">
      <v-card>
        <v-card-title class="headline">Cancel</v-card-title>
        <v-card-text class="subheading text-xs-center">Are you sure you want to exit without saving?</v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn flat color="error" @click="cancel()">Yes</v-btn>
          <v-btn flat @click="cancelDialog = false">No</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
  import notes from "@/services/notes";

  export default {
    name: "edit",
    data: () => ({
      uuid: null,
      note: notes.new(),
      noteEncrypted: false,
      tags: [],
      loading: true,
      cancelDialog: false
    }),
    created() {
      this.uuid = this.$route.params.uuid;
      notes.local.tags().then(list => this.tags = list);
      if (!this.uuid) {
        this.loading = false;
        return;
      }
      notes.local.get(this.uuid).then(note => {
        this.note = note;
        this.noteEncrypted = !!note.crypto;
        if (note.crypto && this.$root.$data.password) {
          return notes.crypto.decrypt(note, this.$root.$data.password);
        }
        return note;
      }).then(note => {
        if (!note.crypto) {
          this.loading = false;
        } else {
          this.cancel();
        }
      });
    },
    methods: {
      readNote(uuid) {
        this.$router.push({name: "read", params: {uuid}});
      },
      saveNote() {
        this.note.date = new Date();
        if (this.noteEncrypted) {
          notes.crypto.encrypt(this.note, this.$root.$data.password).then(() => this.__saveNoteStep2());
        } else {
          this.__saveNoteStep2();
        }
      },
      __saveNoteStep2() {
        if (this.uuid) {
          notes.local.update(this.note).then(() => this.readNote(this.uuid));
        } else {
          notes.local.add(this.note).then(() => this.readNote(this.note.uuid));
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