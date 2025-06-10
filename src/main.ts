import "./assets/main.css";

import { createApp } from "vue";
import { configure } from "vue-gtag";
import App from "./App.vue";
import router from "./router";
//@ts-expect-error still working on exporting type declarations
import CryptoTronPlugin from "@jabez007/cryptotron.vue";

const app = createApp(App);

app.use(CryptoTronPlugin, {
  router,
  parentRouteName: "cryptotron",
});

console.debug(router.getRoutes());

configure({
  tagId: "G-6R9GYD8S4K",
  pageTracker: {
    router,
  },
});

app.use(router);

app.mount("#app");
