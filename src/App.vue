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

    .v-navigation-drawer

      .v-text-field

        .v-input__control
          min-height 24px

          .v-input__slot
            padding 0

            label
            input
              padding 0
              font-size 13px

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

  .bl-markdown
    overflow-wrap break-word

    code
      box-shadow none
      -webkit-box-shadow none
      padding 0 2px
      font-weight normal
      color #24292e

      &:before
      &:after
        content ""

    pre

      code
        padding 4px

    table
      border-spacing 0
      border-collapse collapse

      tbody

        tr:nth-child(2n-1)
          background-color #f6f8fa

      th
      td
        border 1px solid #dfe2e5
        padding 0px 6px


</style>