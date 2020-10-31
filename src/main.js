import "material-design-icons-iconfont/dist/material-design-icons.css";
import "typeface-roboto";
import Vue from "vue";
import Router from "vue-router";
import Vuetify from "vuetify/lib";
import {Ripple} from "vuetify/lib/directives";
import "vuetify/src/stylus/app.styl";
import VueShortKey from "vue-shortkey";
import App from "@/App.vue";
import Home from "@/views/Home.vue";
import utils from "@/services/utils";
import "@/registerServiceWorker";

Vue.use(Router);
Vue.use(Vuetify, {
  iconfont: "md",
  directives: {Ripple}
});
Vue.use(VueShortKey);

const routes = [
  {
    path: "/",
    name: "home",
    component: Home
  },
  {
    path: "/note/new",
    name: "new",
    component: () => import("@/views/Edit.vue")
  },
  {
    path: "/note/:uuid",
    name: "read",
    component: () => import("@/views/Read.vue")
  },
  {
    path: "/note/:uuid/edit",
    name: "edit",
    component: () => import("@/views/Edit.vue")
  },
  {
    path: "/*access_token=*",
    name: "google_auth",
    component: () => import("@/views/GoogleAuth.vue")
  },
  {
    path: "/tags",
    name: "tags",
    component: () => import("@/views/Tags.vue")
  }
];

new Vue({
  router: new Router({routes}),
  data: {
    metrics: {
      on: utils.settings.debug(),
      tags: 0,
      notes: 0
    },
    isMobile: utils.isMobile,
    tagFilter: utils.settings.tagFilter(),
    selectedTags: utils.settings.selectedTags(),
    searchText: utils.settings.searchText(),
    password: ""
  },
  watch: {
    tagFilter(value) {
      utils.settings.updateTagFilter(value);
    },
    selectedTags(value) {
      utils.settings.updateSelectedTags(value);
    },
    searchText(value) {
      utils.settings.updateSearchText(value);
    }
  },
  render: html => html(App)
}).$mount("#app");
