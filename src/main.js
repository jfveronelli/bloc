import Vue from "vue";
import Router from "vue-router";
import Vuetify from "vuetify/lib";
import "vuetify/src/stylus/app.styl";
import App from "@/App.vue";
import Home from "@/views/Home.vue";
import "@/registerServiceWorker";

Vue.use(Router);
Vue.use(Vuetify, {iconfont: "md"});

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
    path: "/note/:id",
    name: "read",
    component: () => import("@/views/Read.vue")
  },
  {
    path: "/note/:id/edit",
    name: "edit",
    component: () => import("@/views/Edit.vue")
  }
];

const data = {
  notes: [
    {
      title: "Brunch this weekend?",
      labels: ["Uno", "Dos", "Tres"],
      content: "### Hola mundo!"
    },
    {
      title: "Summer BBQ",
      labels: ["Cuatro"],
      content: "### Chau mundo!"
    },
    {
      title: "Oui oui",
      labels: ["Cinco", "Seis"],
      content: "### Mi mundo!"
    }
  ]
};

new Vue({
  router: new Router({routes}),
  data,
  render: html => html(App)
}).$mount("#app");
