<template></template>

<script>
  import notes from "@/services/notes";

  export default {
    name: "GoogleAuth",
    created() {
      notes.remote.updateToken(document.location.hash);
      this.$router.replace({name: "home", query: {sync: "true"}});
    }
  }
</script>