import "./assets/main.css";

import { createApp } from "vue";
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

app.use(router);

app.mount("#app");
