import Vue from 'vue';
import './plugins/vuetify';
import Babylon from 'vue-babylonjs';
import VueClipboard from 'vue-clipboard2';
import VueKonva from 'vue-konva';
import App from './App.vue';
import router from './router/index';
import './registerServiceWorker';

Vue.use(Babylon);
Vue.use(VueClipboard);
Vue.use(VueKonva);

Vue.config.productionTip = false;

new Vue({
  router,
  render: h => h(App),
}).$mount('#app');
