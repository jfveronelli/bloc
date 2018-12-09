<template>
  <v-container fluid>
    <v-toolbar app clipped-left>
      <bl-main-btn/>
      <v-toolbar-title class="headline">Bloc</v-toolbar-title>
      <v-spacer/>
      <bl-back-btn/>
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
            <bl-progress-circle v-else/>
          </v-card-text>
        </v-card>
      </v-flex>
    </v-layout>
  </v-container>
</template>

<script>
  import MainButton from "@/components/MainButton.vue";
  import BackButton from "@/components/BackButton.vue";
  import ProgressCircle from "@/components/ProgressCircle.vue";
  import notes from "@/services/notes";

  export default {
    name: "Tags",
    components: {
      "bl-main-btn": MainButton,
      "bl-back-btn": BackButton,
      "bl-progress-circle": ProgressCircle
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