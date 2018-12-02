<template>
  <v-container fluid>
    <v-toolbar app clipped-left>
      <v-toolbar-title class="headline">Bloc</v-toolbar-title>
      <v-spacer/>
      <v-tooltip bottom :disabled="$root.isMobile">
        <v-btn flat icon slot="activator" :disabled="stage !== 'loaded'" @click.stop="noteEncrypted = !noteEncrypted">
          <v-icon v-if="noteEncrypted">lock_open</v-icon>
          <v-icon v-else>lock</v-icon>
        </v-btn>
        <span v-if="noteEncrypted">Unlock</span>
        <span v-else>Lock</span>
      </v-tooltip>
      <v-tooltip bottom :disabled="$root.isMobile">
        <v-btn flat icon slot="activator" :disabled="stage !== 'loaded'" v-shortkey="['ctrl', 's']" @shortkey="saveNote()" @click.stop="saveNote()">
          <v-icon>save</v-icon>
        </v-btn>
        <span>Save<br/>[ Ctrl S ]</span>
      </v-tooltip>
      <v-tooltip bottom :disabled="$root.isMobile">
        <v-btn flat icon slot="activator" v-shortkey="['esc']" @shortkey="cancelDialog = true" @click.stop="cancelDialog = true">
          <v-icon>keyboard_backspace</v-icon>
        </v-btn>
        <span>Cancel<br/>[ Esc ]</span>
      </v-tooltip>
    </v-toolbar>

    <v-layout justify-center>
      <v-flex xs12 md10 lg8>
        <v-card>
          <v-card-text>
            <div v-if="stage === 'loaded'">
              <v-text-field label="Title" v-model="note.title"/>
              <v-combobox multiple chips clearable label="Tags" v-model="note.tags" :items="tags">
                <template slot="selection" slot-scope="data">
                  <v-chip small close class="caption" :selected="data.selected" @input="removeTag(data.item)">
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
              <v-textarea rows="20" label="Content" v-model="note.text"></v-textarea>
            </div>
            <div v-else>
              <p class="text-xs-center">
                <v-progress-circular indeterminate color="primary" :size="70" :width="7"></v-progress-circular>
              </p>
            </div>
          </v-card-text>
        </v-card>
      </v-flex>
    </v-layout>

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

    <v-dialog persistent v-model="passwordDialog" max-width="400">
      <v-card>
        <v-card-title class="headline">Confirm password</v-card-title>
        <v-card-text>
          <v-text-field required label="Password" :type="passwordShown? 'text': 'password'"
              :append-icon="passwordShown? 'visibility_off': 'visibility'" v-model="$root.password"
              @click:append="passwordShown = !passwordShown"></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn flat @click="__saveNoteStep2()">Ok</v-btn>
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
      note: notes.model.note(),
      noteWasEncrypted: false,
      noteEncrypted: false,
      tags: [],
      stage: "loading",
      cancelDialog: false,
      passwordDialog: false,
      passwordShown: false
    }),
    created() {
      this.uuid = this.$route.params.uuid;
      notes.local.tags().then(list => this.tags = list);
      if (!this.uuid) {
        this.stage = "loaded";
        return;
      }
      notes.local.get(this.uuid).then(note => {
        this.note = note;
        let encrypted = !!note.crypto;
        this.noteWasEncrypted = encrypted;
        this.noteEncrypted = encrypted;
        if (note.crypto && this.$root.password) {
          return notes.crypto.decrypt(note, this.$root.password);
        }
        return note;
      }).then(note => {
        if (!note.crypto) {
          this.stage = "loaded";
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
          if (!this.noteWasEncrypted || !this.$root.password) {
            this.passwordDialog = true;
          } else {
            this.__saveNoteStep2();
          }
        } else {
          this.__saveNoteStep3();
        }
      },
      __saveNoteStep2() {
        this.passwordDialog = false;
        if (this.$root.password) {
          this.stage = "saving";
          notes.crypto.encrypt(this.note, this.$root.password).then(this.__saveNoteStep3);
        }
      },
      __saveNoteStep3() {
        this.stage = "saving";
        let promise = this.uuid? notes.local.update(this.note): notes.local.add(this.note);
        promise.then(() => this.readNote(this.note.uuid));
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