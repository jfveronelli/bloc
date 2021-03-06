<template>
  <v-container fluid>
    <v-toolbar app clipped-left>
      <bl-main-btn/>
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
      <bl-back-btn default="false" @go-back="openCancelDialog()"/>
    </v-toolbar>

    <v-layout justify-center>
      <v-flex xs12 md10 lg8>
        <v-card>
          <v-card-text>
            <div v-if="stage === 'loaded'">
              <v-text-field label="Title" ref="titleField" v-model="note.title"/>
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
            <bl-progress-circle v-else/>
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

    <bl-password-dlg title="Confirm password" button="Ok" focused="false" ref="passwordDialog"
        @password-confirmed="__saveNoteStep2()"/>
  </v-container>
</template>

<script>
  import MainButton from "@/components/MainButton.vue";
  import BackButton from "@/components/BackButton.vue";
  import ProgressCircle from "@/components/ProgressCircle.vue";
  import PasswordDialog from "@/components/PasswordDialog.vue";
  import notes from "@/services/notes";

  export default {
    name: "Edit",
    components: {
      "bl-main-btn": MainButton,
      "bl-back-btn": BackButton,
      "bl-progress-circle": ProgressCircle,
      "bl-password-dlg": PasswordDialog
    },
    data: () => ({
      uuid: null,
      note: notes.model.note(),
      noteWasEncrypted: false,
      noteEncrypted: false,
      tags: [],
      stage: "loading",
      cancelDialog: false
    }),
    created() {
      this.uuid = this.$route.params.uuid;

      // Browser hack to handle back button
      window.history.pushState({}, "");
      window.addEventListener("popstate", this.onBrowserBackButton);

      notes.local.tags().then(list => this.tags = list);
      if (!this.uuid) {
        this.stage = "loaded";
        this.$nextTick(() => this.$refs.titleField.focus());
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
    destroyed() {
      window.removeEventListener("popstate", this.onBrowserBackButton);
    },
    methods: {
      saveNote() {
        this.note.date = new Date();
        if (this.noteEncrypted) {
          if (!this.noteWasEncrypted || !this.$root.password) {
            this.$refs.passwordDialog.open();
          } else {
            this.__saveNoteStep2();
          }
        } else {
          this.__saveNoteStep3();
        }
      },
      __saveNoteStep2() {
        if (this.$root.password) {
          this.stage = "saving";
          notes.crypto.encrypt(this.note, this.$root.password).then(this.__saveNoteStep3);
        }
      },
      __saveNoteStep3() {
        this.stage = "saving";
        if (this.uuid) {
          notes.local.update(this.note).then(this.cancel);
        } else {
          notes.local.add(this.note).then(() => this.$router.replace({name: "read", params: {uuid: this.note.uuid}}));
        }
      },
      removeTag(tag) {
        this.note.tags.splice(this.note.tags.indexOf(tag), 1);
      },
      cancel() {
        this.$router.go(-2);
      },
      openCancelDialog() {
        if (this.uuid || this.note.title || this.note.text) {
          this.cancelDialog = true;
        } else {
          this.cancel();
        }
      },
      onBrowserBackButton() {
        this.$router.go(1);
        this.openCancelDialog();
      }
    }
  };
</script>