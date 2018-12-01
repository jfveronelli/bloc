<template>
  <v-container fluid>
    <v-navigation-drawer app clipped v-model="drawer">
      <v-list dense>
        <v-list-tile @click="openPasswordDialog()">
          <v-list-tile-action>
            <v-icon>vpn_key</v-icon>
          </v-list-tile-action>
          <v-list-tile-content>
            <v-list-tile-title>Password</v-list-tile-title>
          </v-list-tile-content>
        </v-list-tile>
        <v-tooltip right :disabled="$root.$data.isMobile">
          <v-list-tile slot="activator" v-shortkey="['ctrl', 'i']" @shortkey="syncNotes()" @click="syncNotes()">
            <v-list-tile-action>
              <v-icon>sync</v-icon>
            </v-list-tile-action>
            <v-list-tile-content>
              <v-list-tile-title>Synchronize</v-list-tile-title>
            </v-list-tile-content>
          </v-list-tile>
          <span>Sync<br/>[ Ctrl I ]</span>
        </v-tooltip>
        <v-list-group v-model="drawerAdmin">
          <v-list-tile slot="activator">
            <v-list-tile-content>
              <v-list-tile-title>Administration</v-list-tile-title>
            </v-list-tile-content>
          </v-list-tile>
          <v-list-tile @click="exportNotes()">
            <v-list-tile-action>
              <v-icon>archive</v-icon>
            </v-list-tile-action>
            <v-list-tile-content>
              <v-list-tile-title>Export all listed</v-list-tile-title>
            </v-list-tile-content>
          </v-list-tile>
          <v-list-tile @click="openImportDialog()">
            <v-list-tile-action>
              <v-icon>unarchive</v-icon>
            </v-list-tile-action>
            <v-list-tile-content>
              <v-list-tile-title>Import notes</v-list-tile-title>
            </v-list-tile-content>
          </v-list-tile>
          <v-list-tile @click="openWipeDialog()">
            <v-list-tile-action>
              <v-icon>layers_clear</v-icon>
            </v-list-tile-action>
            <v-list-tile-content>
              <v-list-tile-title>Remove all</v-list-tile-title>
            </v-list-tile-content>
          </v-list-tile>
        </v-list-group>
        <v-list-group v-model="drawerTag">
          <v-list-tile slot="activator">
            <v-list-tile-content>
              <v-list-tile-title>Tags</v-list-tile-title>
            </v-list-tile-content>
          </v-list-tile>
          <v-list-tile @click="toggleTagFilter()">
            <v-list-tile-action>
              <v-icon>label_important</v-icon>
            </v-list-tile-action>
            <v-list-tile-content>
              <v-list-tile-title>All</v-list-tile-title>
            </v-list-tile-content>
          </v-list-tile>
          <v-list-tile>
            <v-list-tile-action>
              <v-icon>search</v-icon>
            </v-list-tile-action>
            <v-list-tile-content>
              <v-list-tile-title>
                <v-text-field flat solo clearable hide-details label="Filter"
                    v-model="$root.$data.tagFilter" v-on:input="tagFilterChanged()"/>
              </v-list-tile-title>
            </v-list-tile-content>
          </v-list-tile>
          <v-divider></v-divider>
          <v-list-tile v-for="tag in filteredTags" :key="'tag_filter_' + tag" @click="toggleTagFilter(tag)">
            <v-list-tile-action>
              <v-icon v-if="$root.$data.selectedTags.includes(tag)" color="yellow">label</v-icon>
              <v-icon v-else>label</v-icon>
            </v-list-tile-action>
            <v-list-tile-content>
              <v-list-tile-title>{{ tag }}</v-list-tile-title>
            </v-list-tile-content>
          </v-list-tile>
        </v-list-group>
      </v-list>
    </v-navigation-drawer>

    <v-toolbar app clipped-left>
      <v-toolbar-side-icon @click.stop="drawer = !drawer"></v-toolbar-side-icon>
      <v-toolbar-title class="headline">Bloc</v-toolbar-title>
      <v-spacer/>
      <v-slide-x-transition>
        <v-text-field flat solo clearable hide-details prepend-inner-icon="search" label="Search" v-if="search"
            v-model="$root.$data.searchText" v-on:input="searchTextChanged()"/>
      </v-slide-x-transition>
      <v-btn flat icon v-if="!search" @click.stop="search = !search">
        <v-icon>search</v-icon>
      </v-btn>
    </v-toolbar>

    <v-layout justify-center>
      <v-flex xs12 md10 lg8>
        <v-card v-if="notes.length > 0">
          <v-card-text>
            <div class="text-xs-right caption">
              {{notes.length}} notes
            </div>
            <v-list>
              <template v-for="(note, i) in notes">
                <v-divider inset v-if="i > 0" :key="'note_divider_' + note.uuid"></v-divider>
                <v-list-tile avatar :key="'note_' + note.uuid" @click="$router.push({name: 'read', params: {uuid: note.uuid}})">
                  <v-list-tile-avatar>
                    <v-badge overlap color="white">
                      <v-icon small v-if="note.crypto" slot="badge">lock</v-icon>
                      <v-icon>notes</v-icon>
                    </v-badge>
                  </v-list-tile-avatar>
                  <v-list-tile-content>
                    <v-list-tile-title>{{ note.title }}</v-list-tile-title>
                    <v-list-tile-sub-title>
                      <v-chip disabled small text-color="black" class="caption"
                          v-for="tag in note.tags" :key="'note_' + note.uuid + '_tag_' + tag">{{ tag }}</v-chip>
                    </v-list-tile-sub-title>
                  </v-list-tile-content>
                  <v-list-tile-action class="hidden-sm-and-down">
                    <v-btn flat icon @click.stop="openRemoveDialog(note)">
                      <v-icon>delete</v-icon>
                    </v-btn>
                  </v-list-tile-action>
                </v-list-tile>
              </template>
            </v-list>
          </v-card-text>
        </v-card>
      </v-flex>
    </v-layout>

    <v-tooltip top :disabled="$root.$data.isMobile">
      <v-btn fab fixed bottom right dark color="pink" slot="activator" v-shortkey="['ctrl', 'a']" @shortkey="createNote()" @click="createNote()">
        <v-icon>add</v-icon>
      </v-btn>
      <span>Add<br/>[ Ctrl A ]</span>
    </v-tooltip>

    <v-dialog persistent v-model="passwordDialog" max-width="400">
      <v-card>
        <v-card-title class="headline">Password</v-card-title>
        <v-card-text>
          <div>
            <v-text-field required label="Password" :type="passwordShown? 'text': 'password'"
                :append-icon="passwordShown? 'visibility_off': 'visibility'" v-model="$root.$data.password"
                @click:append="passwordShown = !passwordShown"></v-text-field>
          </div>
          <div class="caption">
            <v-icon small>message</v-icon>
            <span class="bl-space-left">For security reasons, any view refresh will clear the password</span>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn flat @click="passwordDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog persistent v-model="syncDialog" max-width="400">
      <v-card>
        <v-card-title class="headline">Synchronizing</v-card-title>
        <v-card-text class="subheading font-weight-bold text-xs-center">
          <v-progress-circular indeterminate color="primary"></v-progress-circular>
          <span class="ml-4 mr-5">Please wait...</span>
          <div>&nbsp;</div>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog persistent v-model="importDialog" max-width="400">
      <v-card>
        <v-card-title class="headline">Import notes</v-card-title>
        <v-card-text class="text-xs-center subheading">
          <div v-if="!importMessage">
            <upload-btn title="Import" accept="application/zip" :fileChangedCallback="importNotes"></upload-btn>
          </div>
          <div v-else v-html="importMessage"></div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn flat :disabled="stage === 'importing'" @click="importDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog persistent v-model="wipeDialog" max-width="400">
      <v-card>
        <v-card-title class="headline">Remove all</v-card-title>
        <v-card-text class="subheading text-xs-center">
          <div>Are you sure you want to continue?</div>
          <div>All local data and settings will be removed.</div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn flat color="error" @click="wipeAll()">Yes</v-btn>
          <v-btn flat @click="wipeDialog = false">No</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="removeDialog" max-width="400">
      <v-card>
        <v-card-title class="headline">Remove note</v-card-title>
        <v-card-text class="subheading">
          <div>Are you sure you want to remove this note?</div>
          <div v-if="selectedNote" class="font-weight-medium">{{ selectedNote.title }}</div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn flat color="error" @click="removeNote()">Yes</v-btn>
          <v-btn flat @click="removeDialog = false">No</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script>
  import UploadButton from "vuetify-upload-button";
  import saveAs from "file-saver";
  import notes from "@/services/notes";
  import utils from "@/services/utils";

  export default {
    name: "home",
    components: {
      "upload-btn": UploadButton
    },
    data: () => ({
      drawer: null,
      drawerAdmin: false,
      drawerTag: true,
      search: false,
      stage: "loaded",
      passwordDialog: false,
      passwordShown: false,
      syncDialog: false,
      importDialog: false,
      importMessage: "",
      wipeDialog: false,
      removeDialog: false,
      selectedNote: null,
      tags: [],
      filteredTags: [],
      notes: []
    }),
    created() {
      this.search = !!this.$root.$data.searchText;
      if (this.$route.query.sync) {
        this.$router.replace({name: "home"});
        this.syncNotes();
      } else {
        this.refreshTagsAndNotes();
      }
    },
    methods: {
      tagFilterChanged() {
        let tagFilter = this.$root.$data.tagFilter;
        utils.settings.updateTagFilter(tagFilter);
        if (tagFilter) {
          let isPhrase = utils.isPhrase(tagFilter);
          this.filteredTags = this.tags.filter(tag => isPhrase.in(tag));
        } else {
          this.filteredTags = this.tags;
        }
      },
      toggleTagFilter(tag) {
        let selectedTags = [];
        if (tag) {
          selectedTags = this.$root.$data.selectedTags;
          if (selectedTags.includes(tag)) {
            selectedTags.splice(selectedTags.indexOf(tag), 1);
          } else {
            selectedTags.push(tag);
          }
        } else {
          this.$root.$data.selectedTags = selectedTags;
        }
        utils.settings.updateSelectedTags(selectedTags);
        this.refreshNotes();
      },
      searchTextChanged() {
        utils.settings.updateSearchText(this.$root.$data.searchText);
        this.refreshNotes();
      },
      refreshTagsAndNotes() {
        notes.local.tags().then(tags => {
          this.tags = tags;
          let filteredTags = tags;
          let tagFilter = this.$root.$data.tagFilter;
          if (tagFilter) {
            let isPhrase = utils.isPhrase(tagFilter);
            filteredTags = tags.filter(tag => isPhrase.in(tag));
          }
          this.filteredTags = filteredTags;
          let selectedTags = this.$root.$data.selectedTags.filter(tag => tags.includes(tag));
          this.$root.$data.selectedTags = selectedTags;
          utils.settings.updateSelectedTags(selectedTags);
          this.refreshNotes();
        });
      },
      refreshNotes() {
        let params = {tags: this.$root.$data.selectedTags.slice(), text: this.$root.$data.searchText};
        notes.local.list(params).then(list => this.notes = list);
      },
      createNote() {
        this.$router.push({name: "new"});
      },
      removeNote() {
        notes.local.remove(this.selectedNote.uuid).then(this.refreshTagsAndNotes);
        this.selectedNote = null;
        this.removeDialog = false;
      },
      exportNotes() {
        this.closeMiniDrawer();
        let uuids = this.notes.map(note => note.uuid);
        notes.local.export(uuids).then(blob => saveAs(blob, "bloc-" + utils.localDate() + ".zip"));
      },
      syncNotes() {
        this.closeMiniDrawer();
        if (!notes.remote.token()) {
          notes.remote.requestToken();
        } else {
          this.syncDialog = true;
          notes.synchronizer.sync().then(() => {
            this.refreshTagsAndNotes();
            this.syncDialog = false
          }).catch(error => {
            if (error.response && error.response.status === 401) {
              notes.remote.requestToken();
            } else {
              throw error;
            }
          });
        }
      },
      importNotes(file) {
        if (file && file.name.toLowerCase().endsWith(".zip") && file.size > 0) {
          this.stage = "importing";
          this.importMessage = "Importing...";
          notes.local.import(file).then(res => {
            this.importMessage = "Imported " + res.imported + " notes.<br/>Ignored " + res.ignored +
                " existing notes.</div>";
            this.stage = "loaded";
            this.refreshTagsAndNotes();
          });
        }
      },
      wipeAll() {
        notes.local.wipe();
        notes.remote.updateToken();
        utils.settings.wipe();
        this.$root.$data.searchText = "";
        this.$root.$data.password = "";
        this.refreshTagsAndNotes();
        this.wipeDialog = false;
      },
      closeMiniDrawer() {
        if (["xs", "sm", "md"].includes(this.$vuetify.breakpoint.name)) {
          this.drawer = false;
        }
      },
      openRemoveDialog(note) {
        this.selectedNote = note;
        this.removeDialog = true;
      },
      openPasswordDialog() {
        this.closeMiniDrawer();
        this.passwordShown = false;
        this.passwordDialog = true;
      },
      openImportDialog() {
        this.closeMiniDrawer();
        this.importMessage = "";
        this.importDialog = true;
      },
      openWipeDialog() {
        this.closeMiniDrawer();
        this.wipeDialog = true;
      }
    }
  };
</script>

<style scoped lang="stylus">
  .bl-space-left
    margin-left 5px
</style>