<template></template>

<script>
  import notes from "@/services/notes";

  export default {
    name: "google_auth",
    created() {
      notes.remote.updateToken(document.location.hash);
      this.$router.push({name: "home", query: {sync: "true"}});
    }
  }
</script>