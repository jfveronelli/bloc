<template>
  <v-container fluid>
    <v-toolbar app clipped-left>
      <v-toolbar-title class="headline">Bloc</v-toolbar-title>
      <v-spacer/>
      <v-tooltip bottom>
        <v-btn flat icon slot="activator" :disabled="stage !== 'loaded'" v-shortkey="['ctrl', 'e']" @shortkey="editNote()" @click.stop="editNote()">
          <v-icon>edit</v-icon>
        </v-btn>
        <span>Edit<br/>[ Ctrl E ]</span>
      </v-tooltip>
      <v-tooltip bottom>
        <v-btn flat icon slot="activator" v-shortkey="['ctrl', 'd']" @shortkey="removeDialog = true" @click.stop="removeDialog = true">
          <v-icon>delete</v-icon>
        </v-btn>
        <span>Remove<br/>[ Ctrl D ]</span>
      </v-tooltip>
      <v-tooltip bottom>
        <v-btn flat icon slot="activator" v-shortkey="['esc']" @shortkey="cancel()" @click.stop="cancel()">
          <v-icon>keyboard_backspace</v-icon>
        </v-btn>
        <span>Exit<br/>[ Esc ]</span>
      </v-tooltip>
    </v-toolbar>

    <v-layout justify-center>
      <v-flex xs12 md10 lg8>
        <v-card>
          <v-card-title>
            <div v-if="stage === 'loaded' || stage === 'locked'">
              <div class="headline font-weight-medium">
                <span v-if="noteEncrypted" class="mr-3"><v-icon>lock</v-icon></span>
                <span>{{ note.title }}</span>
              </div>
              <v-chip small class="body-1" color="primary" text-color="white" v-for="tag in note.tags" :key="tag">
                {{ tag }}
              </v-chip>
            </div>
          </v-card-title>
          <v-card-text>
            <div v-if="stage === 'loaded'" class="markdown-body" v-html="noteText"></div>
            <p v-else-if="stage === 'locked'" class="headline text-lg-center">
              [ Content is encrypted: password is not set or is invalid ]
            </p>
            <p v-else class="text-lg-center">
              <v-progress-circular indeterminate color="primary" :size="70" :width="7"></v-progress-circular>
            </p>
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
      note: notes.model.note(),
      noteEncrypted: false,
      noteText: "",
      stage: "loading",
      removeDialog: false
    }),
    created() {
      this.uuid = this.$route.params.uuid;
      notes.local.get(this.uuid).then(note => {
        this.note = note;
        this.noteEncrypted = !!note.crypto;
        if (note.crypto && this.$root.$data.password) {
          return notes.crypto.decrypt(note, this.$root.$data.password);
        }
        return note;
      }).then(note => {
        if (!note.crypto) {
          this.noteText = marked(note.text);
          this.stage = "loaded";
        } else {
          this.stage = "locked";
        }
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