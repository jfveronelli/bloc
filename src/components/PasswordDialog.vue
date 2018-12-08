<template>
  <v-dialog persistent v-model="dialog" max-width="400">
    <v-card>
      <v-card-title class="headline">{{ title || "Password" }}</v-card-title>
      <v-card-text>
        <div>
          <v-text-field required label="Password" ref="passwordField" :type="passwordShown? 'text': 'password'"
              :append-icon="passwordShown? 'visibility_off': 'visibility'" v-model="$root.password"
              @click:append="passwordShown = !passwordShown" v-on:keyup.enter="close()"/>
        </div>
        <div class="caption">
          <v-icon small>message</v-icon>
          <span class="bl-space-left">For security reasons, any view refresh will clear the password</span>
        </div>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn flat @click="close()">{{ button || "Close" }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script>
  export default {
    name: "PasswordDialog",
    props: ["title", "button", "focused"],
    data: () => ({
      dialog: false,
      passwordShown: false
    }),
    methods: {
      open() {
        this.passwordShown = false;
        this.dialog = true;
        if (this.focused !== "false") {
          this.$nextTick(() => this.$refs.passwordField.focus());
        }
      },
      close() {
        this.dialog = false;
        this.$emit("password-dialog-closed");
      }
    }
  };
</script>