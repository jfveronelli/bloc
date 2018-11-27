<template>
  <v-app>
    <v-content>
      <router-view/>
    </v-content>
  </v-app>
</template>

<script>
  export default {
    name: "app"
  };
</script>

<style lang="stylus">
  #app

    .v-chip.theme--light
      background-color #eee

    .v-chip--small
      height 14px

      &.v-chip--removable
        height 22px

      .v-chip__content
        padding: 0 5px

    @media screen and (max-width 520px)

      .v-content

        .container
          padding 0

        .v-card__title
        .v-card__text
          padding 6px

          .v-list__tile
            padding 0

          .v-list__tile__avatar
            min-width 46px

          .v-divider--inset:not(.v-divider--vertical)
            margin 0
            max-width: 100%
</style>