<template>
  <v-container fluid>
    <v-toolbar app clipped-left>
      <bl-main-btn/>
      <v-toolbar-title class="headline">Bloc</v-toolbar-title>
      <v-spacer/>
      <v-tooltip bottom v-if="!$root.isMobile">
        <v-btn flat icon slot="activator" v-shortkey="['esc']" @shortkey="$router.go(-1)" @click.stop="$router.go(-1)">
          <v-icon>keyboard_backspace</v-icon>
        </v-btn>
        <span>Go back<br/>[ Esc ]</span>
      </v-tooltip>
    </v-toolbar>

    <v-layout justify-center>
      <v-flex xs12 md10 lg8>
        <v-card>
          <v-card-text>
            <div v-if="stage !== 'loading'">
              <v-select label="Tag to replace" ref="tagSelect" :items="tags" v-model="tag"/>
              <v-text-field label="New tag" hint="Fill to replace the selected tag, or leave blank to remove it" v-model="newTag"/>
              <v-text-field label="Another new tag" hint="You may add a 2nd new tag" v-model="newTag2"/>
              <div class="text-xs-center">
                <v-btn color="primary" :disabled="stage === 'renaming' || !tag" @click="updateTag()">
                  <span v-if="newTag && newTag2">Replace and Add</span>
                  <span v-else-if="newTag || newTag2">Replace</span>
                  <span v-else>Remove</span>
                </v-btn>
              </div>
            </div>
            <div v-else>
              <p class="text-xs-center">
                <v-progress-circular indeterminate color="primary" :size="70" :width="7"></v-progress-circular>
              </p>
            </div>
          </v-card-text>
        </v-card>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
  import MainButton from "@/components/MainButton.vue";
  import notes from "@/services/notes";

  export default {
    name: "Tags",
    components: {
      "bl-main-btn": MainButton
    },
    data: () => ({
      tags: [],
      tag: null,
      newTag: "",
      newTag2: "",
      stage: "loading"
    }),
    created() {
      this.refresh();
    },
    methods: {
      refresh() {
        this.stage = "loading";
        notes.local.tags().then(tags => {
          this.tags = tags;
          this.newTag = "";
          this.newTag2 = "";
          this.stage = "loaded";
          this.$nextTick(() => this.$refs.tagSelect.focus());
        });
      },
      updateTag() {
        let newTags = [];
        if (this.newTag) {
          newTags.push(this.newTag);
        }
        if (this.newTag2 && !newTags.includes(this.newTag2)) {
          newTags.push(this.newTag2);
        }
        this.stage = "renaming";
        notes.local.updateTag(this.tag, newTags).then(() => this.refresh());
      }
    }
  };
</script>