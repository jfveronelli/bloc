<template>
  <v-container fluid>
    <v-toolbar app clipped-left>
      <v-toolbar-title class="headline">Bloc</v-toolbar-title>
      <v-spacer/>
      <v-btn flat icon @click.stop="$router.push({name: 'edit', params: {id: $route.params.id}})">
        <v-icon>edit</v-icon>
      </v-btn>
      <v-btn flat icon @click.stop="$router.push({name: 'home'})">
        <v-icon>keyboard_backspace</v-icon>
      </v-btn>
    </v-toolbar>
    <div>{{ $root.$data.notes[$route.params.id].title }}</div>
  </v-container>
</template>

<script>
  export default {
    name: "read"
  };
</script>