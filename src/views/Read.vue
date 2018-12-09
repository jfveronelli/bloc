<template>
  <v-container fluid>
    <v-toolbar app clipped-left>
      <bl-main-btn/>
      <v-toolbar-title class="headline">Bloc</v-toolbar-title>
      <v-spacer/>
      <v-tooltip bottom :disabled="$root.isMobile">
        <v-btn flat icon slot="activator" :disabled="stage !== 'loaded'" v-shortkey="['ctrl', 'e']" @shortkey="editNote()" @click.stop="editNote()">
          <v-icon>edit</v-icon>
        </v-btn>
        <span>Edit<br/>[ Ctrl E ]</span>
      </v-tooltip>
      <v-tooltip bottom :disabled="$root.isMobile">
        <v-btn flat icon slot="activator" v-shortkey="['ctrl', 'd']" @shortkey="$refs.removeDialog.open()" @click.stop="$refs.removeDialog.open()">
          <v-icon>delete</v-icon>
        </v-btn>
        <span>Remove<br/>[ Ctrl D ]</span>
      </v-tooltip>
      <bl-back-btn/>
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
              <div class="mt-1">
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
                <v-btn color="primary" @click="$refs.passwordDialog.open()">Password</v-btn>
              </p>
            </div>
            <bl-progress-circle v-else/>
          </v-card-text>
        </v-card>
      </v-flex>
    </v-layout>

    <bl-note-creation-btn/>

    <bl-password-dlg ref="passwordDialog" @password-confirmed="decryptAndRenderNote()"/>

    <bl-note-removal-dlg ref="removeDialog" @remove-note="removeNote()"/>
  </v-container>
</template>

<script>
  import MainButton from "@/components/MainButton.vue";
  import BackButton from "@/components/BackButton.vue";
  import NoteCreationButton from "@/components/NoteCreationButton.vue";
  import ProgressCircle from "@/components/ProgressCircle.vue";
  import NoteRemovalDialog from "@/components/NoteRemovalDialog.vue";
  import PasswordDialog from "@/components/PasswordDialog.vue";
  import notes from "@/services/notes";
  import markdown from "@/services/markdown";

  export default {
    name: "Read",
    components: {
      "bl-main-btn": MainButton,
      "bl-back-btn": BackButton,
      "bl-note-creation-btn": NoteCreationButton,
      "bl-progress-circle": ProgressCircle,
      "bl-note-removal-dlg": NoteRemovalDialog,
      "bl-password-dlg": PasswordDialog
    },
    data: () => ({
      uuid: null,
      note: notes.model.note(),
      noteEncrypted: false,
      noteText: "",
      stage: "loading"
    }),
    created() {
      this.uuid = this.$route.params.uuid;
      notes.local.get(this.uuid).then(note => {
        this.note = note;
        this.noteEncrypted = !!note.crypto;
        this.decryptAndRenderNote();
      });
    },
    methods: {
      editNote() {
        this.$router.push({name: "edit", params: {uuid: this.uuid}});
      },
      removeNote() {
        notes.local.remove(this.uuid).then(() => this.$router.go(-1));
      },
      decryptAndRenderNote() {
        this.stage = "loading";
        if (this.note.crypto && this.$root.password) {
          notes.crypto.decrypt(this.note, this.$root.password).then(this.renderNote);
        } else {
          this.renderNote();
        }
      },
      renderNote() {
        if (!this.note.crypto) {
          this.noteText = markdown.render(this.note.text);
          this.stage = "loaded";
        } else {
          this.noteText = "";
          this.stage = "locked";
        }
      }
    }
  };
</script>