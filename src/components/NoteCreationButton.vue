<template>
  <v-tooltip top :disabled="$root.isMobile">
    <v-btn fab fixed bottom right dark color="pink" slot="activator" v-shortkey="['ctrl', 'a']" @shortkey="createNote()"
        @click="createNote()">
      <v-icon>add</v-icon>
    </v-btn>
    <span>Add<br/>[ Ctrl A ]</span>
  </v-tooltip>
</template>

<script>
  export default {
    name: "NoteCreationButton",
    methods: {
      createNote() {
        this.$router.push({name: "new"});
      }
    }
  }
</script>