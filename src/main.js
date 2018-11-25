import Vue from "vue";
import Router from "vue-router";
import Vuetify from "vuetify/lib";
import "vuetify/src/stylus/app.styl";
import VueShortKey from "vue-shortkey";
import "github-markdown-css";
import App from "@/App.vue";
import Home from "@/views/Home.vue";
import "@/registerServiceWorker";

Vue.use(Router);
Vue.use(Vuetify, {iconfont: "md"});
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
  }
];

new Vue({
  router: new Router({routes}),
  data: {
    selectedTags: [],
    searchText: ""
  },
  render: html => html(App)
}).$mount("#app");
