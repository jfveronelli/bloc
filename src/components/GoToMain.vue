<template>
  <v-tooltip bottom>
    <v-btn icon slot="activator" @click="$router.push({name: 'home'})">
      <v-icon>arrow_upward</v-icon>
    </v-btn>
    <span>Go to main screen</span>
  </v-tooltip>
</template>

<script>
  export default {
    name: "go_to_main"
  };
</script>