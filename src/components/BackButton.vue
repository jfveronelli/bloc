<template>
  <v-tooltip bottom v-if="!$root.isMobile">
    <v-btn flat icon slot="activator" v-shortkey="['esc']" @shortkey="back()" @click.stop="back()">
      <v-icon>keyboard_backspace</v-icon>
    </v-btn>
    <span>Go back<br/>[ Esc ]</span>
  </v-tooltip>
</template>

<script>
  export default {
    name: "BackButton",
    props: ["default"],
    methods: {
      back() {
        if (this.default !== "false") {
          this.$router.go(-1);
        } else {
          this.$emit("go-back");
        }
      }
    }
  }
</script>