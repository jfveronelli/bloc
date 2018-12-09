<template>
  <v-dialog v-model="dialog" max-width="400">
    <v-card>
      <v-card-title class="headline">Remove note</v-card-title>
      <v-card-text class="subheading">
        <div>Are you sure you want to remove this note?</div>
        <div v-if="note" class="font-weight-medium">{{ note.title }}</div>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn flat color="error" @click="confirm()">Yes</v-btn>
        <v-btn flat @click="dialog = false">No</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
  export default {
    name: "NoteRemovalDialog",
    props: ["note"],
    data: () => ({
      dialog: false
    }),
    methods: {
      open() {
        this.dialog = true;
      },
      confirm() {
        this.dialog = false;
        this.$emit("remove-note");
      }
    }
  }
</script>