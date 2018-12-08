<template>
  <v-container fluid>
    <v-toolbar app clipped-left>
      <GoToMain/>
      <v-toolbar-title class="headline">Bloc</v-toolbar-title>
      <v-spacer/>
      <v-tooltip bottom :disabled="$root.isMobile">
        <v-btn flat icon slot="activator" :disabled="stage !== 'loaded'" v-shortkey="['ctrl', 'e']" @shortkey="editNote()" @click.stop="editNote()">
          <v-icon>edit</v-icon>
        </v-btn>
        <span>Edit<br/>[ Ctrl E ]</span>
      </v-tooltip>
      <v-tooltip bottom :disabled="$root.isMobile">
        <v-btn flat icon slot="activator" v-shortkey="['ctrl', 'd']" @shortkey="removeDialog = true" @click.stop="removeDialog = true">
          <v-icon>delete</v-icon>
        </v-btn>
        <span>Remove<br/>[ Ctrl D ]</span>
      </v-tooltip>
      <v-tooltip bottom v-if="!$root.isMobile">
        <v-btn flat icon slot="activator" v-shortkey="['esc']" @shortkey="cancel()" @click.stop="cancel()">
          <v-icon>keyboard_backspace</v-icon>
        </v-btn>
        <span>Go back<br/>[ Esc ]</span>
      </v-tooltip>
    </v-toolbar>

    <v-layout justify-center>
      <v-flex xs12 md10 lg8>
        <v-card>
          <v-card-title v-if="stage === 'loaded' || stage === 'locked'">
            <div>
              <div class="title">
                <span v-if="noteEncrypted" class="mr-3"><v-icon>lock</v-icon></span>
                <span>{{ note.title }}</span>
              </div>
              <div class="bl-subtitle">
                <v-chip small class="caption" color="primary" text-color="white" v-for="tag in note.tags" :key="tag">
                  {{ tag }}
                </v-chip>
              </div>
            </div>
          </v-card-title>
          <v-card-text>
            <div v-if="stage === 'loaded'" class="bl-markdown" v-html="noteText"></div>
            <div v-else-if="stage === 'locked'" class="headline text-xs-center">
              <p>[ Content is encrypted: password is not set or is invalid ]</p>
              <p>
                <v-btn color="primary" @click="openPasswordDialog()">Password</v-btn>
              </p>
            </div>
            <p v-else class="text-xs-center">
              <v-progress-circular indeterminate color="primary" :size="70" :width="7"></v-progress-circular>
            </p>
          </v-card-text>
        </v-card>
      </v-flex>
    </v-layout>

    <v-tooltip top :disabled="$root.isMobile">
      <v-btn fab fixed bottom right dark color="pink" slot="activator" v-shortkey="['ctrl', 'a']" @shortkey="createNote()" @click="createNote()">
        <v-icon>add</v-icon>
      </v-btn>
      <span>Add<br/>[ Ctrl A ]</span>
    </v-tooltip>

    <v-dialog persistent v-model="passwordDialog" max-width="400">
      <v-card>
        <v-card-title class="headline">Password</v-card-title>
        <v-card-text>
          <div>
            <v-text-field required label="Password" ref="passwordField" :type="passwordShown? 'text': 'password'"
                :append-icon="passwordShown? 'visibility_off': 'visibility'" v-model="$root.password"
                @click:append="passwordShown = !passwordShown"></v-text-field>
          </div>
          <div class="caption">
            <v-icon small>message</v-icon>
            <span class="bl-space-left">For security reasons, any view refresh will clear the password</span>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn flat @click="closePasswordDialog()">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

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
  import GoToMain from "@/components/GoToMain.vue";
  import marked from "marked";
  import notes from "@/services/notes";

  export default {
    name: "read",
    components: {GoToMain},
    data: () => ({
      uuid: null,
      note: notes.model.note(),
      noteEncrypted: false,
      noteText: "",
      stage: "loading",
      passwordDialog: false,
      passwordShown: false,
      removeDialog: false
    }),
    created() {
      this.uuid = this.$route.params.uuid;
      notes.local.get(this.uuid).then(note => {
        this.note = note;
        this.noteEncrypted = !!note.crypto;
        return this.decryptNote();
      }).then(this.renderNote);
    },
    methods: {
      createNote() {
        this.$router.push({name: "new"});
      },
      editNote() {
        this.$router.push({name: "edit", params: {uuid: this.uuid}});
      },
      removeNote() {
        notes.local.remove(this.uuid).then(res => {
          this.removeDialog = false;
          this.cancel();
        });
      },
      async decryptNote() {
        this.stage = "loading";
        if (this.note.crypto && this.$root.password) {
          return notes.crypto.decrypt(this.note, this.$root.password);
        }
      },
      renderNote() {
        if (!this.note.crypto) {
          this.noteText = marked(this.note.text);
          this.stage = "loaded";
        } else {
          this.noteText = "";
          this.stage = "locked";
        }
      },
      cancel() {
        if (this.removeDialog) {
          this.removeDialog = false;
        } else {
          this.$router.go(-1);
        }
      },
      openPasswordDialog() {
        this.passwordShown = false;
        this.passwordDialog = true;
        this.$nextTick(() => this.$refs.passwordField.focus());
      },
      closePasswordDialog() {
        this.passwordDialog = false;
        this.decryptNote().then(this.renderNote);
      }
    }
  };
</script>

<style scoped lang="stylus">
  .bl-subtitle
    margin-top 4px

  .bl-markdown
    overflow-wrap break-word
</style>