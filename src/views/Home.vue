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
        <v-tooltip right :disabled="$root.isMobile">
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
          <v-list-tile @click="$router.push({name: 'tags'})">
            <v-list-tile-action>
              <v-icon>local_offer</v-icon>
            </v-list-tile-action>
            <v-list-tile-content>
              <v-list-tile-title>Tags</v-list-tile-title>
            </v-list-tile-content>
          </v-list-tile>
          <v-list-tile @click="toggleMetrics()">
            <v-list-tile-action>
              <v-icon>timer</v-icon>
            </v-list-tile-action>
            <v-list-tile-content>
              <v-list-tile-title>
                <span v-if="$root.metrics.on">Disable profiling</span>
                <span v-else>Enable profiling</span>
              </v-list-tile-title>
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
                    v-model="$root.tagFilter" @input="tagFilterChanged()"/>
              </v-list-tile-title>
            </v-list-tile-content>
          </v-list-tile>
          <v-divider></v-divider>
          <v-list-tile v-for="tag in filteredTags" :key="'tag_filter_' + tag" @click="toggleTagFilter(tag)">
            <v-list-tile-action>
              <v-icon v-if="$root.selectedTags.includes(tag)" color="yellow">label</v-icon>
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
        <v-text-field flat solo clearable hide-details prepend-inner-icon="search" label="Search" ref="searchField"
            v-if="search" v-model="$root.searchText" @input="refreshNotes()"/>
      </v-slide-x-transition>
      <v-btn flat icon v-if="!search" @click.stop="openSearchField()">
        <v-icon>search</v-icon>
      </v-btn>
    </v-toolbar>

    <v-layout justify-center>
      <v-flex xs12 md10 lg8>
        <v-card v-if="notes.length > 0">
          <v-card-text>
            <div class="text-xs-right caption">
              <div>{{notes.length}} notes</div>
              <div v-if="$root.metrics.on">
                Tags: {{$root.metrics.tags}} millis<br/>
                Notes: {{$root.metrics.notes}} millis
              </div>
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

    <bl-note-creation-btn/>

    <bl-password-dlg ref="passwordDialog"/>

    <v-dialog persistent v-model="syncDialog" max-width="400">
      <v-card>
        <v-card-title class="headline">Synchronizing</v-card-title>
        <v-card-text class="subheading">
          <bl-progress-circle/>
          <div class="mb-3 text-xs-center font-weight-bold">Please wait...</div>
        </v-card-text>
      </v-card>
    </v-dialog>

    <v-dialog persistent v-model="importDialog" max-width="400">
      <v-card>
        <v-card-title class="headline">Import notes</v-card-title>
        <v-card-text class="text-xs-center subheading">
          <div v-if="!importMessage">
            <v-upload-btn title="Import" accept="application/zip" :fileChangedCallback="importNotes"></v-upload-btn>
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

    <bl-note-removal-dlg ref="removeDialog" :note="selectedNote" @remove-note="removeNote()"/>
  </v-container>
</template>

<script>
  import UploadButton from "vuetify-upload-button";
  import NoteCreationButton from "@/components/NoteCreationButton.vue";
  import ProgressCircle from "@/components/ProgressCircle.vue";
  import PasswordDialog from "@/components/PasswordDialog.vue";
  import NoteRemovalDialog from "@/components/NoteRemovalDialog.vue";
  import saveAs from "file-saver";
  import notes from "@/services/notes";
  import utils from "@/services/utils";

  export default {
    name: "Home",
    components: {
      "v-upload-btn": UploadButton,
      "bl-note-creation-btn": NoteCreationButton,
      "bl-progress-circle": ProgressCircle,
      "bl-password-dlg": PasswordDialog,
      "bl-note-removal-dlg": NoteRemovalDialog
    },
    data: () => ({
      drawer: null,
      drawerAdmin: false,
      drawerTag: true,
      search: false,
      stage: "loaded",
      syncDialog: false,
      importDialog: false,
      importMessage: "",
      wipeDialog: false,
      selectedNote: null,
      tags: [],
      filteredTags: [],
      notes: []
    }),
    created() {
      this.search = !!this.$root.searchText;
      if (this.$route.query.sync) {
        this.$router.replace({name: "home"});
        this.syncNotes();
      } else {
        this.refreshTagsAndNotes();
      }
    },
    methods: {
      toggleMetrics() {
        let debug = !this.$root.metrics.on;
        this.$root.metrics.on = debug;
        utils.settings.updateDebug(debug);
      },
      tagFilterChanged() {
        let tagFilter = this.$root.tagFilter;
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
          selectedTags = this.$root.selectedTags;
          if (selectedTags.includes(tag)) {
            selectedTags.splice(selectedTags.indexOf(tag), 1);
          } else {
            selectedTags.push(tag);
          }
        } else {
          this.$root.selectedTags = selectedTags;
        }
        this.refreshNotes();
      },
      refreshTagsAndNotes() {
        let startTime = new Date();
        notes.local.tags().then(tags => {
          this.tags = tags;
          let filteredTags = tags;
          let tagFilter = this.$root.tagFilter;
          if (tagFilter) {
            let isPhrase = utils.isPhrase(tagFilter);
            filteredTags = tags.filter(tag => isPhrase.in(tag));
          }
          this.filteredTags = filteredTags;
          this.$root.selectedTags = this.$root.selectedTags.filter(tag => tags.includes(tag));
          this.$root.metrics.tags = new Date() - startTime;
          this.refreshNotes();
        });
      },
      refreshNotes() {
        let startTime = new Date();
        let params = {tags: this.$root.selectedTags.slice(), text: this.$root.searchText};
        notes.local.list(params).then(list => {
          this.notes = list;
          this.$root.metrics.notes = new Date() - startTime;
        });
      },
      removeNote() {
        notes.local.remove(this.selectedNote.uuid).then(this.refreshTagsAndNotes);
        this.selectedNote = null;
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
        this.$root.metrics.on = false;
        this.$root.tagFilter = "";
        this.$root.searchText = "";
        this.$root.password = "";
        this.refreshTagsAndNotes();
        this.wipeDialog = false;
      },
      closeMiniDrawer() {
        if (["xs", "sm", "md"].includes(this.$vuetify.breakpoint.name)) {
          this.drawer = false;
        }
      },
      openSearchField() {
        this.search = true;
        this.$nextTick(() => this.$refs.searchField.focus());
      },
      openRemoveDialog(note) {
        this.selectedNote = note;
        this.$refs.removeDialog.open();
      },
      openPasswordDialog() {
        this.closeMiniDrawer();
        this.$refs.passwordDialog.open();
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